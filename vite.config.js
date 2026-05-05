import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// In dev keep base at "/" so localhost:5174/ works as before.
// In production prefix everything with the repo name so GitHub Pages serves
// it correctly at https://<user>.github.io/vogelhaus/.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/vogelhaus/" : "/",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon-16.png", "favicon-32.png", "apple-touch-icon.png",
        "icon.svg", "sounds/*.mp3",
      ],
      manifest: {
        name: "Mein Vogelhaus",
        short_name: "Vogelhaus",
        description: "Ein kleines Vogelhaus für die Hosentasche",
        theme_color: "#ee7a5a",
        background_color: "#fff6ec",
        display: "standalone",
        orientation: "portrait",
        lang: "de",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Cache everything Vite ships + the public/ assets so the app works offline.
        globPatterns: ["**/*.{js,css,html,mp3,png,svg,webmanifest}"],
        // Audio files are bigger than Workbox's default 2 MiB threshold.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
}));
