import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const outputDirectory = resolve("dist");
const workerConfigs = [];

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

findWorkerConfigs(outputDirectory);
assert.ok(workerConfigs.length > 0, "Astro build must emit a Worker Wrangler config");

function findSessionBindings(value, path = "") {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => findSessionBindings(entry, `${path}[${index}]`));
  }
  if (value === null || typeof value !== "object") {
    return [];
  }

  const matches = [];
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (key.toLowerCase() === "binding" && typeof child === "string" && child.toUpperCase() === "SESSION") {
      matches.push(childPath);
    }
    if (key.toLowerCase() === "kv_namespaces" && Array.isArray(child)) {
      for (const [index, binding] of child.entries()) {
        if (binding?.binding?.toUpperCase() === "SESSION") {
          matches.push(`${childPath}[${index}].binding`);
        }
      }
    }
    matches.push(...findSessionBindings(child, childPath));
  }
  return matches;
}

for (const configPath of workerConfigs) {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const matches = findSessionBindings(config);
  assert.deepEqual(matches, [], `${configPath} must not contain an unrequested SESSION binding`);

  const forbiddenCollections = [
    ["kv_namespaces", config.kv_namespaces ?? []],
    ["d1_databases", config.d1_databases ?? []],
    ["r2_buckets", config.r2_buckets ?? []],
    ["durable_objects.bindings", config.durable_objects?.bindings ?? []],
    ["queues.producers", config.queues?.producers ?? []],
    ["queues.consumers", config.queues?.consumers ?? []],
    ["services", config.services ?? []],
  ];

  for (const [name, bindings] of forbiddenCollections) {
    assert.deepEqual(bindings, [], `${configPath} must not configure ${name}`);
  }

  assert.equal(config.assets?.binding, "ASSETS", `${configPath} must use only the approved static-assets binding`);
  assert.deepEqual(config.vars ?? {}, {}, `${configPath} must not contain unchecked plaintext variables`);
  process.stdout.write(`No SESSION or external data/service bindings in ${configPath}\n`);
}
