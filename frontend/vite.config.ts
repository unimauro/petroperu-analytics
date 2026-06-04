import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Para GitHub Pages el sitio se sirve bajo /<repo>/.
// Sobreescribible con VITE_BASE (p.ej. "/" en dominio propio / Cloudflare).
const base = process.env.VITE_BASE ?? "/petroperu-analytics/";

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
