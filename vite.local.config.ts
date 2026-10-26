import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("./local", import.meta.url)),
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  plugins: [react()],
  build: { outDir: fileURLToPath(new URL("./local-dist", import.meta.url)), emptyOutDir: true, sourcemap: false },
  server: { host: "127.0.0.1", port: 4173, strictPort: true, fs: { allow: [fileURLToPath(new URL(".", import.meta.url))] } },
});
