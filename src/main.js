(() => {
  // ============================== CONFIG ===================================
  const STORAGE_KEY = "vogel.save.v2";
  const OLD_KEY_V1  = "vogel.save.v1";
  const SOUND_KEY   = "vogel.sound.v1";
  const INTRO_KEY   = "vogel.intro.v2";
  const NOW         = () => Date.now();
  const MS_PER_MIN  = 60 * 1000;
  const MAX_BIRDS   = 5;
  const DECAY       = { hunger: 0.6, happy: 0.5, energy: 0.4 };
  const STAGE_DURATIONS = { egg: 3, chick: 30 };

  const SPECIES = [
    { id:"robin",     name:"Rotkehlchen", latin:"Erithacus rubecula",
      body:"#a85a3a", belly:"#f4d3a2", accent:"#e85a3a", chestRed:true,
      songFreq:1900, songStyle:"warble",
      description:"Neugierig und vertraut — kommt im Garten gern dicht an den Menschen heran. Singt das ganze Jahr, auch im Winter. Erkennbar an der orangeroten Brust." },
    { id:"tit",       name:"Blaumeise",   latin:"Cyanistes caeruleus",
      body:"#5fa7d6", belly:"#fff4a3", accent:"#3a3a8c", capBlue:true,
      songFreq:2400, songStyle:"trill",
      description:"Akrobat zwischen den Zweigen — turnt kopfüber an dünnen Ästchen. Brütet gern in Nistkästen. Leuchtende blaue Kappe und Flügel." },
    { id:"goldfinch", name:"Stieglitz",   latin:"Carduelis carduelis",
      body:"#b48a5a", belly:"#fbe7c0", accent:"#e8413a", maskRed:true,
      songFreq:2200, songStyle:"tweet",
      description:"Auch 'Distelfink' — liebt Distelsamen über alles. Rotes Gesicht, gelber Flügelstreif. Oft in kleinen, fröhlichen Trupps unterwegs." },
    { id:"sparrow",   name:"Spatz",       latin:"Passer domesticus",
      body:"#a98463", belly:"#efe1c5", accent:"#5e3e22",
      songFreq:1500, songStyle:"chip",
      description:"Der Haussperling — frech, gesellig, überall in der Stadt zu Hause. Badet gern im Sand und tschilpt unermüdlich von Zaun und Dachrinne." },
    { id:"kingfisher",name:"Eisvogel",    latin:"Alcedo atthis",
      body:"#3a8ec8", belly:"#e88848", accent:"#0a4a78",
      songFreq:2700, songStyle:"tweet",
      description:"Schillernd türkis und orange. Sitzt geduldig auf einem Ast über klarem Wasser und stürzt sich kopfüber auf kleine Fische. Selten und scheu." },
    { id:"bullfinch", name:"Gimpel",      latin:"Pyrrhula pyrrhula",
      body:"#3a3a4a", belly:"#e08080", accent:"#1a1a2a",
      songFreq:1700, songStyle:"warble",
      description:"Auch 'Dompfaff' genannt. Männchen mit knallroter Brust, Weibchen sandgrau. Frisst Knospen und Beeren. Ein leiser, melancholischer Pfiff." },
    { id:"wren",      name:"Zaunkönig",   latin:"Troglodytes troglodytes",
      body:"#8a6a3a", belly:"#d8b890", accent:"#4a3a1a",
      songFreq:2600, songStyle:"trill",
      description:"Winzig, aber laut! Singt für seine Größe erstaunlich kraftvoll. Schlüpft durch dichtes Gebüsch — ständig in Bewegung mit aufgestelltem Schwänzchen." },
    { id:"siskin",    name:"Erlenzeisig", latin:"Spinus spinus",
      body:"#a8b04a", belly:"#fbf0a0", accent:"#3a4a1a",
      songFreq:2300, songStyle:"trill",
      description:"Klein und gelbgrün. Bevorzugt Erlen- und Birkensamen. Gesellig, oft in kleinen Trupps gemeinsam mit Stieglitzen unterwegs." },
  ];
  // Wild-only species: appear as Garten-Besuch, can't be raised as pets.
  const WILD_SPECIES = [
    { id:"blackbird", name:"Amsel",       latin:"Turdus merula",
      body:"#1a1a1a", belly:"#3a3a3a", accent:"#e8a44a",
      songFreq:2000, songStyle:"warble", wildOnly:true,
      description:"Schwarz mit gelbem Schnabel (Männchen), Weibchen braun. Hat einen melodischen, flötenden Gesang. Hüpft auf Wiesen und sucht Würmer." },
    { id:"greattit",  name:"Kohlmeise",   latin:"Parus major",
      body:"#5a8a4a", belly:"#fff4a3", accent:"#1a1a2a", capBlue:true,
      songFreq:2200, songStyle:"trill", wildOnly:true,
      description:"Größer als die Blaumeise, mit schwarzem Kopf und gelber Brust. Ihr 'zi-tä-zi-tä' ist im Frühling überall zu hören." },
    { id:"chaffinch", name:"Buchfink",    latin:"Fringilla coelebs",
      body:"#7090a8", belly:"#c8806a", accent:"#a85a3a", chestRed:true,
      songFreq:1900, songStyle:"warble", wildOnly:true,
      description:"Häufiger Waldvogel, im Winter oft am Futterhaus. Männchen mit blaugrauem Kopf und rotbrauner Brust. Fröhlicher, abfallender Schlag." },
    { id:"woodpecker",name:"Buntspecht",  latin:"Dendrocopos major",
      body:"#1a1a1a", belly:"#fff8e8", accent:"#e8413a", chestRed:true,
      songFreq:1100, songStyle:"chip", wildOnly:true,
      description:"Hämmert lautstark gegen Baumstämme — sucht Insekten unter der Rinde und markiert sein Revier. Schwarz-weiß, mit roter Unterseite." },
  ];
  const ALL_SPECIES = [...SPECIES, ...WILD_SPECIES];
  const SPECIES_BY_ID = Object.fromEntries(ALL_SPECIES.map(s => [s.id, s]));
  // Wild visitors are drawn from all species (your pet's species also flies past).
  const VISITOR_POOL = ALL_SPECIES;
  const NAME_POOL = [
    "Pieps","Tilly","Lotte","Nele","Kuno","Mirka","Felix","Otti","Pippa","Frida",
    "Hugo","Berta","Klaus","Fips","Mira","Jonna","Bobo","Rosa","Emil","Suki",
  ];

  // ============================== UTILS =====================================
  const pick  = arr => arr[Math.floor(Math.random()*arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const uid   = () => (crypto.randomUUID ? crypto.randomUUID() : "b" + Math.random().toString(36).slice(2,10));

  // ============================== STATE =====================================
  // hydrate(): resolves b.speciesId -> b.species from the live SPECIES table.
  // Persisted state holds only speciesId so SPECIES schema can evolve safely.
  function hydrate(b) {
    if (!b.speciesId && b.species && b.species.id) b.speciesId = b.species.id;
    b.species = SPECIES_BY_ID[b.speciesId] || SPECIES[0];
    b.speciesId = b.species.id;
    if (!b.id) b.id = uid();
    if (!b.name) b.name = pick(NAME_POOL);
    return b;
  }
  function newBird() {
    return hydrate({
      id: uid(),
      name: pick(NAME_POOL),
      speciesId: pick(SPECIES).id,
      bornAt: NOW(),
      lastTick: NOW(),
      hunger: 90, happy: 90, energy: 90,
      sleeping: false, sleepStartedAt: 0,
    });
  }
  function defaultState() {
    const b = newBird();
    return { birds: [b], activeId: b.id, journal: { discovered: {} } };
  }
  function ensureJournal(s) { if (!s.journal) s.journal = { discovered: {} }; return s; }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.birds && s.birds.length) {
          s.birds.forEach(hydrate);
          if (!s.activeId || !s.birds.find(b => b.id === s.activeId)) s.activeId = s.birds[0].id;
          return ensureJournal(s);
        }
      }
      const v1 = localStorage.getItem(OLD_KEY_V1);
      if (v1) {
        const old = JSON.parse(v1);
        const b = hydrate({
          id: uid(),
          name: pick(NAME_POOL),
          speciesId: old.species && old.species.id,
          bornAt: old.bornAt || NOW(),
          lastTick: old.lastTick || NOW(),
          hunger: old.hunger ?? 90,
          happy:  old.happy  ?? 90,
          energy: old.energy ?? 90,
          sleeping: !!old.sleeping,
          sleepStartedAt: old.sleepStartedAt || 0,
        });
        return { birds: [b], activeId: b.id, journal: { discovered: {} } };
      }
      return defaultState();
    } catch { return defaultState(); }
  }
  // Strip the hydrated species snapshot so future SPECIES edits propagate.
  let persistFailedOnce = false;
  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state, (k, v) =>
        k === "species" ? undefined : v
      ));
    } catch (e) {
      if (!persistFailedOnce) {
        persistFailedOnce = true;
        console.warn("Vogelhaus: konnte Spielstand nicht speichern", e);
      }
    }
  };

  let state = load();
  let soundOn = localStorage.getItem(SOUND_KEY) !== "0";
  const lastStageMap = new Map();

  const active = () => state.birds.find(b => b.id === state.activeId) || state.birds[0];

  // ============================== AUDIO ENGINE ==============================
  let audioCtx = null;
  function getAudio() {
    if (!soundOn) return null;
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }
  function envGain(ctx, attack, hold, release, peak = 0.18) {
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.linearRampToValueAtTime(peak, t + attack + hold);
    g.gain.linearRampToValueAtTime(0,    t + attack + hold + release);
    g.connect(ctx.destination);
    return g;
  }
  function tone(freqStart, freqEnd, dur, type = "sine", peak = 0.18) {
    const ctx = getAudio(); if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(freqStart, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t + dur);
    osc.connect(envGain(ctx, 0.005, dur * 0.7, dur * 0.3, peak));
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function warble(baseFreq, dur, peak = 0.18) {
    const ctx = getAudio(); if (!ctx) return;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(baseFreq, t);
    for (let i = 1; i <= 6; i++) {
      const f = baseFreq * (1 + (i % 2 === 0 ? 0.15 : -0.1));
      osc.frequency.linearRampToValueAtTime(f, t + (dur * i / 6));
    }
    osc.connect(envGain(ctx, 0.01, dur * 0.7, dur * 0.3, peak));
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function trill(baseFreq, count = 5, peak = 0.16) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => tone(baseFreq * 1.05, baseFreq * 0.95, 0.06, "sine", peak), i * 70);
    }
  }
  function chip(baseFreq, peak = 0.16) {
    tone(baseFreq * 1.2, baseFreq * 0.6, 0.09, "triangle", peak);
  }
  function birdSong(species, big = false) {
    const f = species.songFreq;
    if      (species.songStyle === "warble") warble(f, big ? 0.9 : 0.5);
    else if (species.songStyle === "trill")  trill(f, big ? 8 : 5);
    else if (species.songStyle === "chip")   chip(f);
    else                                     tone(f * 1.1, f * 0.85, big ? 0.25 : 0.15);
  }

  // Real species recordings live in /sounds/<id>.mp3 (xeno-canto via Wikimedia
  // Commons, CC-licensed). If a file is missing or fails to load, we transparently
  // fall back to the synthesized birdSong above.
  const speciesAudio = new Map();
  function playSpeciesSong(species, big = false) {
    if (!soundOn) return;
    let entry = speciesAudio.get(species.id);
    if (!entry) {
      const a = new Audio(`${import.meta.env.BASE_URL}sounds/${species.id}.mp3`);
      a.preload = "auto";
      entry = { audio: a, failed: false };
      a.addEventListener("error", () => { entry.failed = true; }, { once: true });
      speciesAudio.set(species.id, entry);
    }
    if (entry.failed) { birdSong(species, big); return; }
    try {
      entry.audio.currentTime = 0;
      entry.audio.volume = big ? 0.9 : 0.7;
      const p = entry.audio.play();
      if (p && p.catch) p.catch(() => { entry.failed = true; birdSong(species, big); });
    } catch {
      entry.failed = true;
      birdSong(species, big);
    }
  }

  // ============================== SOUND TABLE ===============================
  // Add a sound: add an entry. Reference it from any action by name.
  const SOUNDS = {
    song:        b => playSpeciesSong(b.species),
    songBig:     b => playSpeciesSong(b.species, true),
    knock:       () => tone(180, 60, 0.08, "sine", 0.25),
    knockTriple: () => [0,200,400].forEach(d => setTimeout(SOUNDS.knock, d)),
    lullaby:     () => [440,523,587,523,392].forEach((f,i) =>
                       setTimeout(() => tone(f, f, 0.4, "sine", 0.08), i * 220)),
    pop:         () => tone(900, 200, 0.08, "triangle", 0.2),
    sparkle:     () => [1400,1800,2400].forEach((f,i) =>
                       setTimeout(() => tone(f, f * 1.3, 0.12, "sine", 0.1), i * 80)),
    chime:       () => [1320,1760].forEach((f,i) =>
                       setTimeout(() => tone(f, f, 0.18, "sine", 0.09), i * 90)),
    warmCoo:     () => tone(600, 700, 0.3, "sine", 0.1),
    rockCoo:     () => tone(500, 380, 0.5, "sine", 0.08),
    sleepDown:   () => tone(440, 220, 0.5, "sine", 0.1),
    petPurr:     () => tone(300, 280, 0.5, "sine", 0.05),
    drowsy:      () => tone(280, 260, 0.3, "sine", 0.04),
    swoosh:      () => tone(900, 1300, 0.12, "sine", 0.07),
  };
  const playSound = (id, b) => { const fn = typeof id === "function" ? id : SOUNDS[id]; if (fn) fn(b); };

  // ============================== EFFECTS ===================================
  // Each effect is { kind, ...params }. Add a kind by adding a case below.
  function spawnFloaters(emoji, count, kind = "heart") {
    const stageEl = document.querySelector(".stage");
    const c = document.getElementById("character");
    const r = c.getBoundingClientRect();
    const sr = stageEl.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const h = document.createElement("div");
      h.className = kind;
      h.textContent = emoji;
      h.style.left = (r.left - sr.left + r.width/2 - 10 + (Math.random()*40-20)) + "px";
      h.style.top  = (r.top  - sr.top  + 20 + Math.random()*20) + "px";
      stageEl.appendChild(h);
      setTimeout(() => h.remove(), 1700);
    }
  }
  function spawnButterfly() {
    const stageEl = document.querySelector(".stage");
    const b = document.createElement("div");
    b.className = "butterfly";
    b.textContent = pick(["🦋","🐝","🌼"]);
    b.style.top  = (40 + Math.random() * 80) + "px";
    b.style.left = "-20px";
    stageEl.appendChild(b);
    setTimeout(() => b.remove(), 14000);
  }
  let singingTimer = null;
  function singAnim(big) {
    const c = document.getElementById("character");
    c.classList.add("bird-singing");
    clearTimeout(singingTimer);
    singingTimer = setTimeout(() => c.classList.remove("bird-singing"), big ? 1200 : 600);
  }
  function flashClass(selector, cls) {
    const el = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!el) return;
    el.classList.remove(cls);
    void el.getBoundingClientRect();
    el.classList.add(cls);
  }
  function playEffect(e) {
    if (!e) return;
    switch (e.kind) {
      case "floaters":  return spawnFloaters(e.emoji, e.count || 3, e.css || "heart");
      case "butterfly": return spawnButterfly();
      case "sing":      return singAnim(!!e.big);
      case "eggWarm":   return flashClass("#bird-svg", "egg-warming");
      case "eggShake":  return flashClass("#bird-svg .egg-wobble", "crack-shell");
    }
  }

  // ============================== ACTIONS ===================================
  // Each action: icon, label, optional validate(b), optional apply(b),
  // and feedback(b) -> { speech, sounds: [names], effects: [{kind,...}] }.
  // Add an action: define it here, then list its key in PHASE_BUTTONS below.
  const ACTIONS = {
    // ---- EGG -------------------------------------------------------------
    warmEgg: {
      icon: "🔥", label: "Wärmen",
      apply: b => { b.bornAt -= 12 * 1000; },
      feedback: () => ({
        speech: "Schön warm … 🔥",
        sounds: ["warmCoo"],
        effects: [
          { kind: "eggWarm" },
          { kind: "floaters", emoji: "✨", count: 3 },
        ],
      }),
    },
    rockEgg: {
      icon: "🤲", label: "Wiegen",
      feedback: () => ({
        speech: "Sanft gewiegt …",
        sounds: ["rockCoo"],
        effects: [
          { kind: "eggShake" },
          { kind: "floaters", emoji: "💛", count: 2 },
        ],
      }),
    },
    listenEgg: {
      icon: "👂", label: "Lauschen",
      feedback: b => {
        const left = STAGE_DURATIONS.egg - (NOW() - b.bornAt) / MS_PER_MIN;
        const speech = left < 0.3 ? "Klopf klopf … 🐣"
                     : left < 1.5 ? "…ein leises Rascheln…"
                     :              "…still… aber warm…";
        return {
          speech,
          sounds: ["knockTriple"],
          effects: [{ kind: "floaters", emoji: "🎶", count: 3, css: "note" }],
        };
      },
    },

    // ---- SLEEPING --------------------------------------------------------
    pet: {
      icon: "🪶", label: "Streicheln",
      apply: b => { b.happy = clamp(b.happy + 6, 0, 100); },
      feedback: () => ({
        speech: pick(["…mhmm","…brrrr","…💛"]),
        sounds: ["petPurr"],
        effects: [{ kind: "floaters", emoji: "💛", count: 3 }],
      }),
    },
    lullaby: {
      icon: "🎶", label: "Vorsingen",
      apply: b => {
        b.happy  = clamp(b.happy + 10, 0, 100);
        b.energy = clamp(b.energy + 5, 0, 100);
      },
      feedback: () => ({
        speech: "…träumt …✨",
        sounds: ["lullaby"],
        effects: [
          { kind: "floaters", emoji: "✨", count: 3 },
          { kind: "floaters", emoji: "🎵", count: 2, css: "note" },
        ],
      }),
    },
    wakeUp: {
      icon: "☀️", label: "Wecken",
      apply: b => { b.sleeping = false; },
      feedback: () => ({
        speech: "Hach, schon wach!",
        sounds: ["songBig"],
        effects: [
          { kind: "floaters", emoji: "☀️", count: 3 },
          { kind: "sing", big: true },
        ],
      }),
    },

    // ---- AWAKE -----------------------------------------------------------
    feed: {
      icon: "🌾", label: "Füttern",
      validate: b => b.hunger <= 92 ? true : "Ich bin satt, danke! 🌾",
      apply: b => {
        b.hunger = clamp(b.hunger + 28, 0, 100);
        b.happy  = clamp(b.happy + 4, 0, 100);
      },
      feedback: () => ({
        speech: pick(["Mhh, lecker!","Piep piep!","Mehr Körner!"]),
        sounds: ["song"],
        effects: [
          { kind: "floaters", emoji: "🌾", count: 3 },
          { kind: "sing" },
        ],
      }),
    },
    play: {
      icon: "🎵", label: "Spielen",
      validate: b => b.energy >= 12 ? true : "Zu müde zum Spielen …",
      apply: b => {
        b.happy  = clamp(b.happy + 30, 0, 100);
        b.energy = clamp(b.energy - 10, 0, 100);
        b.hunger = clamp(b.hunger - 6, 0, 100);
      },
      feedback: () => ({
        speech: pick(["Tirili! 🎵","Wieee schön!","Noch ein Lied?"]),
        sounds: ["songBig"],
        effects: [
          { kind: "floaters", emoji: "🎵", count: 4, css: "note" },
          { kind: "butterfly" },
          { kind: "sing", big: true },
        ],
      }),
    },
    startSleep: {
      icon: "🌙", label: "Schlafen",
      apply: b => { b.sleeping = true; b.sleepStartedAt = NOW(); },
      feedback: () => ({
        speech: "Schlaf gut … 💤",
        sounds: ["sleepDown"],
        effects: [
          { kind: "floaters", emoji: "💤", count: 3 },
          { kind: "floaters", emoji: "🌙", count: 1 },
        ],
      }),
    },
  };

  // Which action keys appear as buttons in which phase.
  const PHASE_BUTTONS = {
    egg:      ["warmEgg", "rockEgg", "listenEgg"],
    sleeping: ["pet",     "lullaby", "wakeUp"],
    awake:    ["feed",    "play",    "startSleep"],
  };

  // Tap on the bird itself — feedback only, no state change.
  const TAP_FEEDBACK = {
    egg: b => {
      const left = Math.max(0, STAGE_DURATIONS.egg - (NOW() - b.bornAt) / MS_PER_MIN);
      return {
        speech: left < 0.05 ? "Ich schlüpfe gleich!" : `Tock tock … (${left.toFixed(1)} min)`,
        sounds: ["knock"],
        effects: [{ kind: "eggShake" }],
      };
    },
    sleeping: () => ({
      speech: "Zzz…",
      sounds: ["drowsy"],
      effects: [{ kind: "floaters", emoji: "💤", count: 1 }],
    }),
    awake: () => ({
      speech: pick(["Piep!","Tirili!","Hallo Du!","Ich mag dich.","Zwitscher 🎵","Krümel?"]),
      sounds: ["song"],
      effects: [
        { kind: "floaters", emoji: pick(["💛","💚","🌸","✨"]), count: 3 },
        { kind: "sing" },
      ],
    }),
  };

  // ============================== RUNNER ====================================
  function runFeedback(fb, b) {
    if (!fb) return;
    if (fb.speech) chirpSpeech(typeof fb.speech === "function" ? fb.speech(b) : fb.speech);
    (fb.sounds  || []).forEach(s => playSound(s, b));
    (fb.effects || []).forEach(e => playEffect(e));
  }
  function runAction(name) {
    const def = ACTIONS[name]; if (!def) return;
    const b = active();
    if (def.validate) {
      const ok = def.validate(b);
      if (ok !== true) { chirpSpeech(typeof ok === "string" ? ok : "…"); return; }
    }
    if (def.apply) def.apply(b);
    vibrate(15);
    persist();
    render();
    runFeedback(def.feedback ? def.feedback(b) : null, b);
  }
  function runTap() {
    const b = active();
    vibrate(20);
    runFeedback(TAP_FEEDBACK[phaseOf(b)](b), b);
  }
  // Subtle haptic feedback on supported devices (mostly Android). No-op on iOS.
  function vibrate(pattern) {
    if (navigator.vibrate) try { navigator.vibrate(pattern); } catch {}
  }

  // ============================== LIFECYCLE =================================
  function stageOf(b) {
    const a = (NOW() - b.bornAt) / MS_PER_MIN;
    if (a < STAGE_DURATIONS.egg) return "egg";
    if (a < STAGE_DURATIONS.egg + STAGE_DURATIONS.chick) return "chick";
    return "adult";
  }
  function phaseOf(b) {
    if (stageOf(b) === "egg") return "egg";
    if (b.sleeping) return "sleeping";
    return "awake";
  }
  function tickBird(b) {
    const now = NOW();
    const dt = (now - b.lastTick) / MS_PER_MIN;
    b.lastTick = now;
    if (stageOf(b) === "egg") return;
    // If this tick spans the egg→chick boundary, only the post-hatch slice counts.
    const sinceHatch = (now - b.bornAt) / MS_PER_MIN - STAGE_DURATIONS.egg;
    const eff = Math.max(0, Math.min(dt, sinceHatch));
    if (b.sleeping) {
      b.energy = clamp(b.energy + eff * 4, 0, 100);
      b.hunger = clamp(b.hunger - eff * DECAY.hunger * 0.5, 0, 100);
      if (b.energy >= 100) {
        b.sleeping = false;
        const isActive = b.id === state.activeId;
        chirpSpeech(isActive ? "Ausgeschlafen! ☀️" : `${b.name} ist ausgeschlafen ☀️`);
        setTimeout(() => playSpeciesSong(b.species, true), 200);
        if (isActive) spawnFloaters("☀️", 3);
      }
    } else {
      b.hunger = clamp(b.hunger - eff * DECAY.hunger, 0, 100);
      b.happy  = clamp(b.happy  - eff * DECAY.happy,  0, 100);
      b.energy = clamp(b.energy - eff * DECAY.energy, 0, 100);
    }
  }
  function checkStageTransitions() {
    state.birds.forEach(b => {
      const s = stageOf(b);
      const old = lastStageMap.get(b.id);
      if (old && old !== s) {
        const isActive = b.id === state.activeId;
        if (s === "chick") {
          chirpSpeech(isActive ? "Krrk! Ich bin geschlüpft! 🐣" : `${b.name} ist geschlüpft! 🐣`);
          SOUNDS.pop();
          setTimeout(() => playSpeciesSong(b.species, true), 300);
          if (isActive) spawnFloaters("✨", 6);
          markDiscovered(b.speciesId);
        } else if (s === "adult") {
          chirpSpeech(isActive ? "Schau, ich bin groß! ✨" : `${b.name} ist erwachsen! ✨`);
          SOUNDS.sparkle();
          if (isActive) spawnFloaters("✨", 6);
        }
      }
      lastStageMap.set(b.id, s);
    });
  }
  function tick() {
    state.birds.forEach(tickBird);
    checkStageTransitions();
    persist();
    render();
  }
  state.birds.forEach(b => lastStageMap.set(b.id, stageOf(b)));

  // ============================== MULTI-BIRD ================================
  let swapTimer = null;
  function setActive(id) {
    if (id === state.activeId) return;
    SOUNDS.swoosh();
    clearSpeech();
    const ch = document.getElementById("character");
    ch.classList.add("swap-out");
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      state.activeId = id;
      ch.classList.remove("swap-out");
      persist(); render();
    }, 220);
  }
  function addBird() {
    if (state.birds.length >= MAX_BIRDS) {
      chirpSpeech("Im Nest ist kein Platz mehr 🪺");
      SOUNDS.knock();
      return;
    }
    const b = newBird();
    state.birds.push(b);
    state.activeId = b.id;
    lastStageMap.set(b.id, stageOf(b));
    persist(); render();
    chirpSpeech(`Ein neues Ei: ${b.name}! 🥚`);
    SOUNDS.chime();
    spawnFloaters("✨", 5);
  }

  // ============================== UI ========================================
  let speechTimer = null;
  function chirpSpeech(text) {
    const el = document.getElementById("speech");
    el.textContent = text;
    el.classList.add("visible");
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => el.classList.remove("visible"), 1900);
  }
  function clearSpeech() {
    document.getElementById("speech").classList.remove("visible");
    clearTimeout(speechTimer);
  }
  function setBar(id, val) {
    const bar = document.getElementById(id + "-bar");
    bar.firstElementChild.style.width = val + "%";
    bar.classList.toggle("low", val < 25);
    bar.classList.toggle("med", val >= 25 && val < 55);
    document.getElementById(id + "-val").textContent = Math.round(val);
  }
  // Render caches: skip DOM rebuilds when the relevant signature hasn't changed.
  let lastActionsSig = "";
  let lastSwitcherSig = "";
  let lastBirdSvgSig = "";
  function renderActions() {
    const sig = phaseOf(active());
    if (sig === lastActionsSig) return;
    lastActionsSig = sig;
    const el = document.getElementById("actions");
    el.innerHTML = "";
    PHASE_BUTTONS[sig].forEach(name => {
      const def = ACTIONS[name];
      const btn = document.createElement("button");
      btn.className = "action";
      btn.innerHTML = `<span class="icon">${def.icon}</span><span>${def.label}</span>`;
      btn.addEventListener("click", () => { getAudio(); runAction(name); });
      el.appendChild(btn);
    });
  }
  // Inner SVG paths so journal cards / wild visitors can reuse the same drawings.
  function eggMiniPaths() {
    return `<ellipse cx="20" cy="22" rx="11" ry="14" fill="#fff7e8" stroke="#d8c19a" stroke-width="1.5"/>
      <circle cx="17" cy="20" r="1.2" fill="#d8c19a"/>
      <circle cx="22" cy="24" r="1.2" fill="#d8c19a"/>
      <circle cx="18" cy="28" r="1" fill="#d8c19a"/>`;
  }
  function birdMiniPaths(sp, sleeping = false) {
    const eye = sleeping
      ? `<path d="M14 18 q3 2 5 0" stroke="#222" stroke-width="1.4" fill="none" stroke-linecap="round"/>
         <path d="M21 18 q3 2 5 0" stroke="#222" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
      : `<circle cx="16" cy="18" r="1.7" fill="#222"/>
         <circle cx="24" cy="18" r="1.7" fill="#222"/>`;
    const cap   = sp.capBlue  ? `<path d="M9 14 Q 20 8 31 14 Q 31 17 28 18 L 12 18 Q 9 17 9 14 Z" fill="${sp.accent}"/>` : "";
    const mask  = sp.maskRed  ? `<path d="M14 16 Q 20 12 26 16 Q 26 19 22 20 L 18 20 Q 14 19 14 16 Z" fill="${sp.accent}"/>` : "";
    const chest = sp.chestRed ? `<ellipse cx="17" cy="27" rx="5" ry="4" fill="${sp.accent}" opacity="0.9"/>` : "";
    return `<ellipse cx="20" cy="32" rx="13" ry="6" fill="${sp.body}"/>
      <ellipse cx="20" cy="34" rx="9" ry="4" fill="${sp.belly}"/>
      ${chest}
      <circle cx="20" cy="20" r="11" fill="${sp.body}"/>
      ${cap}${mask}
      ${eye}
      <polygon points="29,20 35,21 29,22" fill="#e8a44a"/>`;
  }
  function miniSvg(b) {
    const inner = stageOf(b) === "egg" ? eggMiniPaths() : birdMiniPaths(b.species, b.sleeping);
    return `<svg viewBox="0 0 40 40" width="40" height="40">${inner}</svg>`;
  }
  function statusBadge(b) {
    const st = stageOf(b);
    if (st === "egg") {
      const left = STAGE_DURATIONS.egg - (NOW() - b.bornAt) / MS_PER_MIN;
      return left < 0.3 ? `<span class="badge hatch">🐣</span>` : `<span class="badge egg">🥚</span>`;
    }
    if (b.sleeping) return `<span class="badge sleep">💤</span>`;
    if (b.hunger < 25 || b.happy < 25 || b.energy < 25) return `<span class="badge urgent">!</span>`;
    return "";
  }
  function switcherSig() {
    return state.activeId + "|" + state.birds.map(b => {
      const st = stageOf(b);
      const urgent = !b.sleeping && st !== "egg" && (b.hunger < 25 || b.happy < 25 || b.energy < 25);
      const left = st === "egg" ? STAGE_DURATIONS.egg - (NOW() - b.bornAt) / MS_PER_MIN : 99;
      const hatchSoon = st === "egg" && left < 0.3;
      return `${b.id}:${b.name}:${b.speciesId}:${st}:${b.sleeping?1:0}:${urgent?1:0}:${hatchSoon?1:0}`;
    }).join(",");
  }
  function renderSwitcher() {
    const sig = switcherSig();
    if (sig === lastSwitcherSig) return;
    lastSwitcherSig = sig;
    const el = document.getElementById("switcher");
    el.innerHTML = "";
    state.birds.forEach(b => {
      const slot = document.createElement("button");
      slot.className = "slot" + (b.id === state.activeId ? " active" : "");
      slot.innerHTML = `
        <div class="avatar">${miniSvg(b)}</div>
        <div class="slot-name">${b.name}</div>
        ${statusBadge(b)}
      `;
      slot.title = b.name + (stageOf(b) === "egg" ? " (Ei)" : ` – ${b.species.name}`);
      slot.addEventListener("click", () => { getAudio(); setActive(b.id); });
      el.appendChild(slot);
    });
    if (state.birds.length < MAX_BIRDS) {
      const add = document.createElement("button");
      add.className = "slot add";
      add.innerHTML = `<div class="avatar plus">＋</div><div class="slot-name">Neues Ei</div>`;
      add.title = "Ein neues Ei ins Nest legen";
      add.addEventListener("click", () => { getAudio(); addBird(); });
      el.appendChild(add);
    }
  }
  function svgFor(st, sp, sleeping) {
    if (st === "egg") {
      return `
        <g class="egg-wobble">
          <ellipse cx="100" cy="180" rx="55" ry="14" fill="rgba(0,0,0,0.12)"/>
          <path d="M100 50 C 60 50, 45 130, 70 165 C 90 190, 110 190, 130 165 C 155 130, 140 50, 100 50 Z"
                fill="#fff7e8" stroke="#d8c19a" stroke-width="2"/>
          <ellipse cx="86" cy="80" rx="10" ry="14" fill="#ffffff" opacity="0.55"/>
          <circle cx="84" cy="100" r="4" fill="#d8c19a"/>
          <circle cx="116" cy="120" r="3" fill="#d8c19a"/>
          <circle cx="92" cy="140" r="3.5" fill="#d8c19a"/>
          <circle cx="120" cy="80" r="2.5" fill="#d8c19a"/>
          <circle cx="74" cy="120" r="2.5" fill="#d8c19a"/>
        </g>`;
    }
    const eyeY = sleeping ? 78 : 76;
    const eyeShape = sleeping
      ? `<path d="M86 ${eyeY} q6 4 12 0" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>
         <path d="M104 ${eyeY} q6 4 12 0" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
      : `<circle cx="92" cy="${eyeY}" r="4.5" fill="#222"/>
         <circle cx="110" cy="${eyeY}" r="4.5" fill="#222"/>
         <circle cx="93.5" cy="${eyeY-1.5}" r="1.4" fill="white"/>
         <circle cx="111.5" cy="${eyeY-1.5}" r="1.4" fill="white"/>`;

    if (st === "chick") {
      return `
        <ellipse cx="100" cy="180" rx="50" ry="10" fill="rgba(0,0,0,0.12)"/>
        <g class="bird-body">
          <ellipse cx="100" cy="135" rx="50" ry="44" fill="${sp.belly}"/>
          <ellipse cx="100" cy="120" rx="44" ry="14" fill="${sp.body}" opacity="0.25"/>
          <circle cx="100" cy="80" r="40" fill="${sp.belly}"/>
          <circle cx="100" cy="62" r="22" fill="${sp.body}" opacity="0.4"/>
          ${eyeShape}
          <ellipse cx="92" cy="86" rx="6" ry="3" fill="#f4a8a8" opacity="0.5"/>
          <ellipse cx="110" cy="86" rx="6" ry="3" fill="#f4a8a8" opacity="0.5"/>
          <polygon points="118,84 142,88 118,92" fill="#e8a44a" stroke="#b87a2a" stroke-width="1"/>
          <ellipse cx="100" cy="56" rx="7" ry="9" fill="${sp.body}"/>
          <circle cx="95" cy="50" r="2.5" fill="${sp.body}"/>
          <circle cx="105" cy="50" r="2.5" fill="${sp.body}"/>
          <line x1="86" y1="172" x2="86" y2="186" stroke="#e8a44a" stroke-width="3.5" stroke-linecap="round"/>
          <line x1="114" y1="172" x2="114" y2="186" stroke="#e8a44a" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M86 184 Q 82 188 80 184" stroke="#e8a44a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <path d="M114 184 Q 118 188 120 184" stroke="#e8a44a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        </g>`;
    }

    const headExtras =
      sp.capBlue   ? `<path d="M62 70 Q 100 30 138 70 Q 138 78 132 80 L 68 80 Q 62 78 62 70 Z" fill="${sp.accent}"/>
                      <path d="M75 80 L 70 95 M 100 78 L 100 96 M 125 80 L 130 95" stroke="${sp.accent}" stroke-width="2.5" fill="none"/>`
      : sp.maskRed ? `<path d="M84 72 Q 100 60 116 72 Q 116 80 108 84 L 92 84 Q 84 80 84 72 Z" fill="${sp.accent}"/>`
      : "";
    const chestRed = sp.chestRed ? `<ellipse cx="92" cy="118" rx="22" ry="20" fill="${sp.accent}" opacity="0.95"/>` : "";

    return `
      <ellipse cx="100" cy="180" rx="58" ry="11" fill="rgba(0,0,0,0.18)"/>
      <g class="bird-body">
        <ellipse cx="100" cy="125" rx="58" ry="52" fill="${sp.body}"/>
        <ellipse cx="100" cy="135" rx="36" ry="40" fill="${sp.belly}"/>
        ${chestRed}
        <ellipse cx="150" cy="115" rx="24" ry="11" fill="${sp.body}"/>
        <path d="M165 113 L 188 105 L 168 118 Z" fill="${sp.body}" opacity="0.85"/>
        <circle cx="100" cy="80" r="42" fill="${sp.body}"/>
        ${headExtras}
        ${eyeShape}
        <ellipse cx="92" cy="92" rx="8" ry="4" fill="#f4a8a8" opacity="0.4"/>
        <ellipse cx="110" cy="92" rx="8" ry="4" fill="#f4a8a8" opacity="0.4"/>
        <polygon points="120,82 148,88 120,94" fill="#e8a44a" stroke="#b87a2a" stroke-width="1"/>
        <line x1="138" y1="86" x2="148" y2="88" stroke="#b87a2a" stroke-width="0.6"/>
        <g class="bird-wing">
          <ellipse cx="68" cy="120" rx="24" ry="34" fill="${sp.body}" opacity="0.95"/>
          <ellipse cx="64" cy="115" rx="14" ry="22" fill="${sp.accent}" opacity="0.45"/>
          <path d="M52 140 L 64 152 L 78 144" stroke="${sp.accent}" stroke-width="1" fill="none" opacity="0.5"/>
        </g>
        <line x1="88" y1="174" x2="88" y2="190" stroke="#e8a44a" stroke-width="4" stroke-linecap="round"/>
        <line x1="112" y1="174" x2="112" y2="190" stroke="#e8a44a" stroke-width="4" stroke-linecap="round"/>
        <path d="M82 188 L 78 192 M 88 190 L 88 194 M 94 188 L 98 192" stroke="#e8a44a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M106 188 L 102 192 M 112 190 L 112 194 M 118 188 L 122 192" stroke="#e8a44a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>`;
  }
  function render() {
    const b = active();
    setBar("hunger", b.hunger);
    setBar("happy",  b.happy);
    setBar("energy", b.energy);

    const st = stageOf(b);
    const badge = document.getElementById("age-badge");
    const name  = document.getElementById("bird-name");
    if      (st === "egg")   { badge.textContent = "Ei";            name.textContent = `${b.name}'s Ei`; }
    else if (st === "chick") { badge.textContent = "Küken";          name.textContent = `${b.name} (Küken)`; }
    else                     { badge.textContent = b.species.name;   name.textContent = `${b.name}, ${b.species.name}`; }

    const ch = document.getElementById("character");
    ch.classList.toggle("sleeping", b.sleeping);

    const birdSig = `${b.id}:${st}:${b.speciesId}:${b.sleeping?1:0}`;
    if (birdSig !== lastBirdSvgSig) {
      lastBirdSvgSig = birdSig;
      document.getElementById("bird-svg").innerHTML = svgFor(st, b.species, b.sleeping);
    }

    renderSwitcher();
    renderActions();
    updateDayNight();
  }

  // ============================== AMBIENT ===================================
  function updateDayNight() {
    const h = new Date().getHours();
    document.body.classList.remove("night", "dawn", "dusk");
    if      (h >= 21 || h < 5)   document.body.classList.add("night");
    else if (h >= 5  && h < 7)   document.body.classList.add("dawn");
    else if (h >= 19 && h < 21)  document.body.classList.add("dusk");
  }
  function buildSky() {
    const sky = document.getElementById("sky");
    [
      { top:"10%", left:"-10%", scale:1,   dur:80  },
      { top:"20%", left:"-30%", scale:0.7, dur:110 },
      { top:"6%",  left:"-50%", scale:1.2, dur:130 },
    ].forEach(c => {
      const el = document.createElement("div");
      el.className = "cloud";
      el.innerHTML = `<svg width="${120*c.scale}" height="${50*c.scale}" viewBox="0 0 120 50">
        <ellipse cx="30" cy="30" rx="26" ry="16" fill="white"/>
        <ellipse cx="60" cy="22" rx="32" ry="20" fill="white"/>
        <ellipse cx="90" cy="32" rx="24" ry="14" fill="white"/>
      </svg>`;
      el.style.top = c.top; el.style.left = c.left;
      el.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(120vw)" }],
        { duration: c.dur * 1000, iterations: Infinity }
      );
      sky.appendChild(el);
    });
    const stars = document.getElementById("stars");
    for (let i = 0; i < 40; i++) {
      const s = document.createElement("div");
      s.className = "star";
      s.style.left = Math.random() * 100 + "%";
      s.style.top  = Math.random() * 60 + "%";
      s.style.animationDelay = (Math.random() * 3) + "s";
      stars.appendChild(s);
    }
  }
  function buildGround() {
    const stageEl = document.querySelector(".stage");
    for (let i = 0; i < 18; i++) {
      const g = document.createElement("div");
      g.className = "grass-blade";
      g.style.left = (Math.random() * 100) + "%";
      g.style.bottom = (28 + Math.random() * 5) + "%";
      g.style.animationDelay = (Math.random() * 4) + "s";
      stageEl.appendChild(g);
    }
    const flowers = [
      { c:"#f4a8c8", center:"#fbe27a" },
      { c:"#fff",    center:"#fbe27a" },
      { c:"#c8a8f4", center:"#fbe27a" },
    ];
    for (let i = 0; i < 6; i++) {
      const f = flowers[i % flowers.length];
      const el = document.createElement("div");
      el.className = "flower";
      el.innerHTML = `<svg viewBox="0 0 14 14" width="14" height="14">
        <circle cx="3"  cy="7"  r="2.5" fill="${f.c}"/>
        <circle cx="11" cy="7"  r="2.5" fill="${f.c}"/>
        <circle cx="7"  cy="3"  r="2.5" fill="${f.c}"/>
        <circle cx="7"  cy="11" r="2.5" fill="${f.c}"/>
        <circle cx="7"  cy="7"  r="2"   fill="${f.center}"/>
      </svg>`;
      el.style.left = (10 + i * 14 + Math.random() * 5) + "%";
      el.style.bottom = (28 + Math.random() * 4) + "%";
      stageEl.appendChild(el);
    }
  }
  function ambientChirp() {
    const delay = 18000 + Math.random() * 30000;
    setTimeout(() => {
      const b = active();
      if (stageOf(b) !== "egg" && !b.sleeping && Math.random() < 0.5) playSpeciesSong(b.species);
      ambientChirp();
    }, delay);
  }

  // ============================== JOURNAL & WILD VISITORS ==================
  function isDiscovered(id) { return !!state.journal.discovered[id]; }
  function markDiscovered(speciesId) {
    const j = state.journal.discovered;
    if (!j[speciesId]) {
      j[speciesId] = { firstSeen: NOW(), count: 1 };
      persist();
      return true; // first sight
    }
    j[speciesId].count++;
    persist();
    return false;
  }

  // --- Wild visitor: a random species drops by the garden every 90-180s.
  let wildEl = null, wildEndTimer = null, wildSongTimer = null;
  const WILD_SPOTS = [
    { side: "left",  bottom: "36%", left: "8%"   },
    { side: "right", bottom: "36%", right: "8%"  },
    { side: "left",  bottom: "33%", left: "14%"  },
    { side: "right", bottom: "33%", right: "14%" },
  ];

  function spawnWildVisit() {
    if (wildEl) return;
    if (document.hidden) { scheduleNextWildVisit(); return; }
    if (stageOf(active()) === "egg") { scheduleNextWildVisit(); return; }

    const sp = pick(VISITOR_POOL);
    const spot = pick(WILD_SPOTS);
    const stageEl = document.querySelector(".stage");

    wildEl = document.createElement("button");
    wildEl.className = "wild-bird from-" + spot.side;
    Object.entries(spot).forEach(([k, v]) => { if (k !== "side") wildEl.style[k] = v; });
    wildEl.innerHTML = `<svg viewBox="0 0 40 40">${birdMiniPaths(sp)}</svg>`;
    wildEl.title = "Wildvogel — antippen!";
    wildEl.addEventListener("click", () => onWildBirdTap(sp));
    stageEl.appendChild(wildEl);

    setTimeout(() => playSpeciesSong(sp), 600);
    wildSongTimer = setInterval(() => playSpeciesSong(sp), 7000 + Math.random() * 5000);
    wildEndTimer = setTimeout(() => endWildVisit(), 25000 + Math.random() * 10000);
  }
  function endWildVisit() {
    if (!wildEl) return;
    const el = wildEl;
    el.style.pointerEvents = "none";
    el.classList.add("flying-out");
    setTimeout(() => el.remove(), 600);
    wildEl = null;
    clearTimeout(wildEndTimer); wildEndTimer = null;
    clearInterval(wildSongTimer); wildSongTimer = null;
    scheduleNextWildVisit();
  }
  function onWildBirdTap(sp) {
    const wasNew = markDiscovered(sp.id);
    if (wasNew) {
      chirpSpeech(`Neu entdeckt: ${sp.name}! ✨`);
      SOUNDS.sparkle();
      spawnFloaters("✨", 5);
      vibrate([60, 40, 60]);
    } else {
      chirpSpeech(sp.name);
      vibrate(25);
    }
    playSpeciesSong(sp, true);
    showSpeciesCard(sp);
    endWildVisit();
  }
  function scheduleNextWildVisit() {
    setTimeout(spawnWildVisit, 90000 + Math.random() * 90000);
  }

  // --- Species detail card: floats over the scene, click outside to dismiss.
  function showSpeciesCard(sp) {
    const j = state.journal.discovered[sp.id];
    const dateText = j
      ? new Date(j.firstSeen).toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric" })
      : "—";
    const overlay = document.createElement("div");
    overlay.className = "species-card-overlay";
    overlay.innerHTML = `
      <div class="species-card">
        <button class="species-card-close" aria-label="Schließen">×</button>
        <div class="species-card-head">
          <div class="species-card-avatar">
            <svg viewBox="0 0 40 40">${birdMiniPaths(sp)}</svg>
          </div>
          <div class="species-card-titles">
            <div class="species-card-name">${sp.name}</div>
            <div class="species-card-latin"><i>${sp.latin || ""}</i></div>
          </div>
        </div>
        <div class="species-card-body">${sp.description || ""}</div>
        <div class="species-card-stats">
          <span>🗓️ ${dateText}</span>
          <span>👁️ ${j ? j.count + "× gesehen" : "noch nicht entdeckt"}</span>
        </div>
        <button class="species-card-play">🔊 Stimme abspielen</button>
      </div>
    `;
    overlay.querySelector(".species-card-close").addEventListener("click", () => overlay.remove());
    overlay.querySelector(".species-card-play").addEventListener("click", () => playSpeciesSong(sp, true));
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // --- Sammelbuch: full grid of all species, locked silhouettes for undiscovered.
  function showJournal() {
    const overlay = document.createElement("div");
    overlay.className = "journal-overlay";
    const found = Object.keys(state.journal.discovered).length;
    overlay.innerHTML = `
      <div class="journal-card">
        <div class="journal-head">
          <h2>📔 Mein Vogel-Sammelbuch</h2>
          <button class="journal-close" aria-label="Schließen">×</button>
        </div>
        <div class="journal-progress">${found} / ${ALL_SPECIES.length} entdeckt</div>
        <div class="journal-grid"></div>
        <div class="journal-credits">Vogelstimmen: Wikimedia Commons (xeno-canto), CC-lizenziert.</div>
      </div>
    `;
    const grid = overlay.querySelector(".journal-grid");
    ALL_SPECIES.forEach(sp => {
      const entry = state.journal.discovered[sp.id];
      const cell = document.createElement("button");
      cell.className = "journal-cell" + (entry ? " found" : " locked");
      if (entry) {
        cell.innerHTML = `
          <div class="journal-avatar"><svg viewBox="0 0 40 40">${birdMiniPaths(sp)}</svg></div>
          <div class="journal-name">${sp.name}</div>
          <div class="journal-count">${entry.count}×</div>
        `;
        cell.addEventListener("click", () => showSpeciesCard(sp));
      } else {
        cell.innerHTML = `
          <div class="journal-avatar"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="rgba(0,0,0,0.18)"/><text x="20" y="26" text-anchor="middle" fill="rgba(0,0,0,0.5)" font-size="18" font-weight="700">?</text></svg></div>
          <div class="journal-name">???</div>
        `;
      }
      grid.appendChild(cell);
    });
    overlay.querySelector(".journal-close").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // ============================== WIRING ====================================
  document.getElementById("character").addEventListener("click", () => { getAudio(); runTap(); });

  const modal = document.getElementById("modal");
  document.getElementById("info-btn").addEventListener("click", () => modal.classList.add("open"));
  document.getElementById("modal-close").addEventListener("click", () => { getAudio(); modal.classList.remove("open"); });

  const soundBtn = document.getElementById("sound-btn");
  const refreshSoundBtn = () => { soundBtn.textContent = soundOn ? "🔊" : "🔇"; };
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    localStorage.setItem(SOUND_KEY, soundOn ? "1" : "0");
    refreshSoundBtn();
    if (soundOn) { getAudio(); SOUNDS.sparkle(); }
  });
  refreshSoundBtn();

  // Inject Sammelbuch button into the topbar (no HTML edit needed).
  const journalBtn = document.createElement("button");
  journalBtn.id = "journal-btn";
  journalBtn.title = "Sammelbuch";
  journalBtn.setAttribute("aria-label", "Sammelbuch");
  journalBtn.textContent = "📔";
  journalBtn.addEventListener("click", () => { getAudio(); showJournal(); });
  document.querySelector(".topbar").insertBefore(journalBtn, soundBtn);

  if (!localStorage.getItem(INTRO_KEY)) {
    modal.classList.add("open");
    localStorage.setItem(INTRO_KEY, "1");
  }

  ambientChirp();
  setInterval(() => {
    const b = active();
    if (stageOf(b) !== "egg" && !b.sleeping && Math.random() < 0.3) spawnButterfly();
  }, 12000);

  buildSky();
  buildGround();
  tick();
  setInterval(tick, 4000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
  setInterval(updateDayNight, 60 * 1000);

  // First wild visitor arrives ~30-60s after start, then every 90-180s.
  setTimeout(spawnWildVisit, 30000 + Math.random() * 30000);
})();
