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
);
