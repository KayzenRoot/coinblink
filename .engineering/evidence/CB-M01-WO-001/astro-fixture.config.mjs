import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

const fixtureRoot = resolve(fileURLToPath(new URL("../../../test/modules/CB-M01/fixture/", import.meta.url)));
const fixtureTempDir = process.env.M01_FIXTURE_TEMP_DIR;
if (!fixtureTempDir || !isAbsolute(fixtureTempDir)) {
  throw new Error("M01_FIXTURE_TEMP_DIR must be an absolute path created by the isolated visual runner.");
}

const resolvedTempDir = resolve(fixtureTempDir);
const tempParent = resolve(tmpdir());
const relativeTempDir = relative(tempParent, resolvedTempDir);
if (
  dirname(resolvedTempDir) !== tempParent ||
  relativeTempDir === ".." ||
  relativeTempDir.startsWith(".." + sep) ||
  basename(resolvedTempDir).startsWith("coinblink-m01-fixture-") === false
) {
  throw new Error("M01_FIXTURE_TEMP_DIR must be a unique CoinBlink M01 child directory of the OS temp root.");
}

export default defineConfig({
  devToolbar: { enabled: false },
  root: fixtureRoot,
  srcDir: fileURLToPath(new URL("../../../test/modules/CB-M01/fixture/src/", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../../public/", import.meta.url)),
  cacheDir: join(resolvedTempDir, "cache"),
  output: "static",
  outDir: join(resolvedTempDir, "dist"),
});
