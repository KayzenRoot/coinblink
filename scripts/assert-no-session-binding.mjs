import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { assertWorkerPreviewConfig } from "./worker-preview-config-safety.mjs";

const outputDirectory = resolve("dist");
const workerConfigs = [resolve("wrangler.jsonc")];

function findWorkerConfigs(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      findWorkerConfigs(path);
    } else if (/^wrangler\.jsonc?$/i.test(entry.name)) {
      workerConfigs.push(path);
    }
  }
}

assertWorkerPreviewConfig(JSON.parse(readFileSync(workerConfigs[0], "utf8")), "wrangler.jsonc");
findWorkerConfigs(outputDirectory);
assert.ok(workerConfigs.length > 1, "Astro build must emit a Worker Wrangler config");

for (const configPath of workerConfigs.slice(1)) {
  assertWorkerPreviewConfig(JSON.parse(readFileSync(configPath, "utf8")), configPath, { generated: true });
  process.stdout.write(`No SESSION, data, service, or production bindings in ${configPath}\n`);
}
