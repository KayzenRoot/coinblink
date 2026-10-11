import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

const fixtureRoot = fileURLToPath(new URL("./", import.meta.url));
export default defineConfig({
  root: fixtureRoot,
  srcDir: fileURLToPath(new URL("./src/", import.meta.url)),
  cacheDir: join(tmpdir(), "coinblink-m01-astro-cache"),
  output: "static",
  outDir: process.env.M01_FIXTURE_OUT_DIR || join(tmpdir(), "coinblink-m01-fixture-dist"),
});
