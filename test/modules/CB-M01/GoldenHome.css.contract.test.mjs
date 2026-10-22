import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stylesheet = await readFile(new URL("../../../src/modules/CB-M01/golden-home.css", import.meta.url), "utf8");
const globalStylesheet = await readFile(new URL("../../../src/styles/global.css", import.meta.url), "utf8");
const baseLayout = await readFile(new URL("../../../src/layouts/BaseLayout.astro", import.meta.url), "utf8");
const englishHome = await readFile(new URL("../../../src/pages/en.astro", import.meta.url), "utf8");
const portugueseHome = await readFile(new URL("../../../src/pages/pt-br.astro", import.meta.url), "utf8");

test("GoldenHome keeps the brand lockup horizontal within the module stylesheet", () => {
  assert.match(stylesheet, /\.cb-home \.brand \{[^}]*flex-direction:\s*row\s*;/u);
});

test("GoldenHome relies on the shared reduced-motion guard instead of duplicating it", () => {
  assert.doesNotMatch(stylesheet, /@media\s*\(prefers-reduced-motion:\s*reduce\)/u);
  assert.match(baseLayout, /import\s+["']\.\.\/styles\/global\.css["']/u);
  assert.match(englishHome, /<BaseLayout[\s\S]*?<GoldenHome\s*\/>[\s\S]*?<\/BaseLayout>/u);
  assert.match(portugueseHome, /<BaseLayout[\s\S]*?<GoldenHome\s+locale=["']pt-br["']\s*\/>[\s\S]*?<\/BaseLayout>/u);
  assert.match(globalStylesheet, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?scroll-behavior:\s*auto\s*!important/u);
  assert.match(globalStylesheet, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation-duration:\s*0\.01ms\s*!important/u);
  assert.match(globalStylesheet, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?transition-duration:\s*0\.01ms\s*!important/u);
});
