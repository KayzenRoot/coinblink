import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      ".astro/**",
      ".wrangler/**",
      "artifacts/**",
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs", "**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["e2e/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // DOM code and page.evaluate callbacks use browser globals.
    files: [
      "public/**/*.js",
      "src/modules/**/*.client.js",
      "test/modules/CB-M07/local-week-browser.test.mjs",
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
);
