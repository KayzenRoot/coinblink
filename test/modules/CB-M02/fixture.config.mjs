import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

const fixtureRoot = resolve(fileURLToPath(new URL("./fixture/", import.meta.url)));
const temp = process.env.CB_M02_A11Y_TEMP || join(tmpdir(), "coinblink-m02-a11y-no-run");
export default defineConfig({
  devToolbar: { enabled: false },
  root: fixtureRoot,
  srcDir: fileURLToPath(new URL("./fixture/src/", import.meta.url)),
  publicDir: fileURLToPath(new URL("../../../public/", import.meta.url)),
  cacheDir: join(temp, "cache"),
  outDir: join(temp, "dist"),
  output: "static",
});
