#!/bin/bash
# Fetch CC-licensed bird recordings from Wikimedia Commons.
# Trims to 8s mono mp3 and saves to public/sounds/<id>.mp3.
# Idempotent: skips if file already exists.

set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/sounds

# id : Latin name : preferred recording type hint (added to search)
species=(
  "robin:Erithacus rubecula:song"
  "tit:Cyanistes caeruleus:song"
  "goldfinch:Carduelis carduelis:song"
  "sparrow:Passer domesticus:call"
  "kingfisher:Alcedo atthis:call"
  "bullfinch:Pyrrhula pyrrhula:song"
  "wren:Troglodytes troglodytes:song"
  "siskin:Spinus spinus:song"
  "blackbird:Turdus merula:song"
  "greattit:Parus major:song"
  "chaffinch:Fringilla coelebs:song"
  "woodpecker:Dendrocopos major:drum"
)

fetch_one() {
  local id="$1" latin="$2" type="$3"
  local out="public/sounds/${id}.mp3"

  if [ -f "$out" ]; then
    echo "skip ${id} (exists)"
    return 0
  fi

  echo "searching ${id} (${latin}, ${type})..."
  local query="${latin} ${type}"
  local search
  search=$(curl -sL --max-time 10 -G \
    --data-urlencode "action=query" \
    --data-urlencode "format=json" \
    --data-urlencode "list=search" \
    --data-urlencode "srsearch=${query} filetype:audio" \
    --data-urlencode "srnamespace=6" \
    --data-urlencode "srlimit=8" \
    "https://commons.wikimedia.org/w/api.php")

  local title
  title=$(echo "$search" | jq -r '.query.search[] | select(.title | test("\\.(mp3|ogg)$"; "i")) | .title' | head -1)
  if [ -z "$title" ] || [ "$title" = "null" ]; then
    echo "  no title for ${id}"
    return 1
  fi

  local info
  info=$(curl -sL --max-time 10 -G \
    --data-urlencode "action=query" \
    --data-urlencode "format=json" \
    --data-urlencode "titles=${title}" \
    --data-urlencode "prop=imageinfo" \
    --data-urlencode "iiprop=url|size|duration|mime" \
    "https://commons.wikimedia.org/w/api.php")

  local url
  url=$(echo "$info" | jq -r '.query.pages | to_entries[0].value.imageinfo[0].url' | sed 's/?.*//')
  if [ -z "$url" ] || [ "$url" = "null" ]; then
    echo "  no url for ${id}"
    return 1
  fi

  echo "  downloading ${id}: ${url##*/}"
  local tmp
  tmp=$(mktemp -t bird).${url##*.}
  if ! curl -sL --max-time 60 -o "$tmp" "$url"; then
    echo "  download failed ${id}"
    rm -f "$tmp"
    return 1
  fi

  # Trim, mono, normalize, encode to mp3 ~64k
  if ffmpeg -y -i "$tmp" -t 8 -ac 1 -ar 44100 -b:a 64k \
       -af "loudnorm=I=-18:TP=-2:LRA=11" "$out" 2>/dev/null; then
    echo "  ✓ ${id} ($(du -h "$out" | cut -f1))"
  else
    echo "  ffmpeg failed ${id}"
    rm -f "$out"
  fi

  rm -f "$tmp"
}

for entry in "${species[@]}"; do
  IFS=":" read -r id latin type <<< "$entry"
  fetch_one "$id" "$latin" "$type" || true
  sleep 2
done

echo "---"
echo "Done. Files in public/sounds/:"
ls -lh public/sounds/ 2>/dev/null || echo "(none)"
