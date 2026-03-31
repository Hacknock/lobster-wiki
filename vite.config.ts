import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/lobster-wiki.ts"),
      name: "LobsterWiki",
      fileName: "lobster-wiki",
      formats: ["es"],
    },
    outDir: "dist",
    minify: true,
    rollupOptions: {
      // lobster.js is loaded dynamically at runtime — do not bundle it
      external: [],
    },
  },
});
