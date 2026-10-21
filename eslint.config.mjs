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
    // Only browser scripts/tests without their own explicit DOM globals.
    files: [
      "public/m01-local-draft-preview.js",
      "src/modules/**/*.client.js",
      "test/modules/CB-M07/local-week-browser.test.mjs",
      "test/modules/CB-M07/local-social-preview.test.mjs",
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    // This script already declares document in a file-level comment.
    files: ["public/m05-draft-preview.js"],
    languageOptions: {
      globals: { window: "readonly" },
    },
  },
);
