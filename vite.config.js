import { defineConfig } from "vite";

// In dev keep base at "/" so localhost:5174/ works as before.
// In production prefix everything with the repo name so GitHub Pages serves
// it correctly at https://<user>.github.io/vogelhaus/.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/vogelhaus/" : "/",
}));
