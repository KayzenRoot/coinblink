import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { test } from "node:test";

const guardPath = resolve("scripts/assert-no-session-binding.mjs");
const approvedConfig = JSON.parse(readFileSync(resolve("wrangler.jsonc"), "utf8"));

function generatedConfig(overrides = {}) {
  return {
    configPath: "wrangler.jsonc",
    userConfigPath: "wrangler.jsonc",
    topLevelName: "coinblink-m00-local",
    definedEnvironments: [],
    compatibility_date: approvedConfig.compatibility_date,
    compatibility_flags: approvedConfig.compatibility_flags,
    jsx_factory: "React.createElement",
    jsx_fragment: "React.Fragment",
    rules: [{ type: "ESModule", globs: ["**/*.js", "**/*.mjs"] }],
    name: "coinblink-m00-local",
    main: "entry.mjs",
    triggers: {},
    assets: { directory: "../client", binding: "ASSETS", not_found_handling: "404-page" },
    vars: {},
    durable_objects: { bindings: [] },
    workflows: [],
    migrations: [],
    exports: {},
    cloudchamber: {},
    send_email: [],
    queues: { producers: [], consumers: [] },
    connect: [],
    kv_namespaces: [],
    r2_buckets: [],
    d1_databases: [],
    vectorize: [],
    ai_search_namespaces: [],
    ai_search: [],
    agent_memory: [],
    hyperdrive: [],
    services: [],
    analytics_engine_datasets: [],
    dispatch_namespaces: [],
    mtls_certificates: [],
    pipelines: [],
    k2: [],
    secrets_store_secrets: [],
    artifacts: [],
    unsafe_hello_world: [],
    flagship: [],
    worker_loaders: [],
    ratelimits: [],
    vpc_services: [],
    vpc_networks: [],
    logfwdr: { bindings: [] },
    python_modules: { exclude: ["**/*.pyc"] },
    dev: {
      ip: "127.0.0.1",
      local_protocol: "http",
      upstream_protocol: "http",
      enable_containers: true,
      generate_types: false,
    },
    previews: {},
    no_bundle: true,
    ...overrides,
  };
}

function runGuard(config) {
  const directory = mkdtempSync(join(tmpdir(), "coinblink-worker-binding-"));
  const relativePath = relative(tmpdir(), directory);
  assert.ok(relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath));

  try {
    const serverDirectory = join(directory, "dist", "server");
    mkdirSync(serverDirectory, { recursive: true });
    writeFileSync(join(serverDirectory, "wrangler.json"), JSON.stringify(config));
    writeFileSync(join(directory, "wrangler.jsonc"), JSON.stringify(approvedConfig));
    const result = spawnSync(process.execPath, [guardPath], { cwd: directory, encoding: "utf8" });
    assert.equal(result.error, undefined);
    return result;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("accepts the approved static asset binding", () => {
  const result = runGuard(generatedConfig());
  assert.equal(result.status, 0, result.stderr);
});

test("accepts only loopback spellings normalized by Windows and Linux builds", () => {
  const linuxResult = runGuard(generatedConfig({ dev: { ...generatedConfig().dev, ip: "localhost" } }));
  assert.equal(linuxResult.status, 0, linuxResult.stderr);

  const publicBindResult = runGuard(generatedConfig({ dev: { ...generatedConfig().dev, ip: "0.0.0.0" } }));
  assert.equal(publicBindResult.status, 1);
  assert.match(publicBindResult.stderr, /bind development traffic to loopback/);
});

test("rejects a SESSION binding nested in a namespace list", () => {
  const config = generatedConfig({ kv_namespaces: [{ binding: "SESSION", id: "session-store" }] });
  const result = runGuard(config);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unreviewed top-level settings|unrequested SESSION binding/);
});

test("rejects a data binding added to the Preview block", () => {
  const config = generatedConfig({ previews: { kv_namespaces: [{ binding: "DATA", id: "production-looking-id" }] } });
  const result = runGuard(config);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /empty isolated previews block/);
});

test("rejects unreviewed top-level variables", () => {
  const config = generatedConfig({ vars: { API_URL: "https://production.invalid" } });
  const result = runGuard(config);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unchecked production plaintext variables/);
});
