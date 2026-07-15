import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [["tests/content/**/*.js", "jsdom"]],
    exclude: ["tests/browser/**", "node_modules/**", "dist/**"],
    include: ["tests/**/*.test.js"],
  },
});
