import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  worker: {
    format: "es",
  },
  build: {
    target: "esnext",
  },
  optimizeDeps: {
    exclude: ["@provablehq/wasm", "@provablehq/sdk"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
