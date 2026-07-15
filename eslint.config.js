import js from "@eslint/js";
import globals from "globals";

const shortFunctions = {
  max: 10,
  skipBlankLines: true,
  skipComments: true,
};

const sourceRules = {
  complexity: ["error", 5],
  "max-lines-per-function": ["error", shortFunctions],
  "no-console": ["warn", { allow: ["warn", "error"] }],
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
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        chrome: "readonly",
      },
      sourceType: "module",
    },
    rules: sourceRules,
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.node,
      sourceType: "module",
    },
    rules: sourceRules,
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
