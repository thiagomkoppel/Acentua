import js from "@eslint/js";
import globals from "globals";

const shortFunctions = {
  max: 10,
  skipBlankLines: true,
  skipComments: true,
};

export default [
  {
    ignores: [
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        chrome: "readonly",
      },
      sourceType: "module",
    },
    rules: {
      complexity: ["error", 5],
      "max-lines-per-function": ["error", shortFunctions],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      sourceType: "module",
    },
  },
];
