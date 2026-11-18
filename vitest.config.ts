import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    unstubGlobals: true,
    restoreMocks: true,
  },
});
