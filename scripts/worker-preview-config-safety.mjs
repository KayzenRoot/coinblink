import assert from "node:assert/strict";

const sourceRootKeys = new Set([
  "$schema",
  "name",
  "main",
  "compatibility_date",
  "compatibility_flags",
  "assets",
  "previews",
  "vars",
  "d1_databases",
  "ai",
  "upload_source_maps",
]);

const generatedRootKeys = new Set([
  "configPath",
  "userConfigPath",
  "topLevelName",
  "definedEnvironments",
  "compatibility_date",
  "compatibility_flags",
  "jsx_factory",
  "jsx_fragment",
  "rules",
  "name",
  "main",
  "triggers",
  "assets",
  "vars",
  "durable_objects",
  "workflows",
  "migrations",
  "exports",
  "cloudchamber",
  "send_email",
  "queues",
  "connect",
  "kv_namespaces",
  "r2_buckets",
  "d1_databases",
  "ai",
  "vectorize",
  "ai_search_namespaces",
  "ai_search",
  "agent_memory",
  "hyperdrive",
  "services",
  "analytics_engine_datasets",
  "dispatch_namespaces",
  "mtls_certificates",
  "pipelines",
  "k2",
  "secrets_store_secrets",
  "artifacts",
  "unsafe_hello_world",
  "flagship",
  "worker_loaders",
  "ratelimits",
  "vpc_services",
  "vpc_networks",
  "logfwdr",
  "python_modules",
  "dev",
  "previews",
  "no_bundle",
  "upload_source_maps",
]);

const resourceBindingKeys = [
  "durable_objects",
  "workflows",
  "migrations",
  "cloudchamber",
  "containers",
  "kv_namespaces",
  "send_email",
  "queues",
  "connect",
  "r2_buckets",
  "d1_databases",
  "vectorize",
  "ai_search_namespaces",
  "ai_search",
  "agent_memory",
  "hyperdrive",
  "services",
  "analytics_engine_datasets",
  "browser",
  "ai",
  "images",
  "media",
  "stream",
  "unsafe",
  "mtls_certificates",
  "tail_consumers",
  "streaming_tail_consumers",
  "dispatch_namespaces",
  "pipelines",
  "k2",
  "secrets_store_secrets",
  "artifacts",
  "ratelimits",
  "worker_loaders",
  "vpc_services",
  "vpc_networks",
  "wasm_modules",
  "text_blobs",
  "data_blobs",
  "secrets",
  "ai_search_namespaces",
  "ai_search",
  "agent_memory",
  "send_email",
  "connect",
  "mtls_certificates",
  "artifacts",
  "unsafe_hello_world",
  "flagship",
  "ratelimits",
  "worker_loaders",
  "wasm_modules",
  "text_blobs",
  "data_blobs",
  "images",
  "media",
  "stream",
  "containers",
];

const OWNER_D1_BINDING = "CMS_DB";
const OWNER_D1_NAME = "coinblink-cms";
const OWNER_D1_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function assertOwnerD1Binding(value, source, generated) {
  assert.ok(Array.isArray(value), `${source} d1_databases must be an array`);
  // Local and preview fixtures may declare the key with no binding. A present
  // binding, however, must be exactly the reviewed owner database.
  if (value.length === 0) return;
  assert.equal(value.length, 1, `${source} must declare exactly one owner D1 binding`);
  const binding = value[0];
  assert.ok(binding && typeof binding === "object" && !Array.isArray(binding),
    `${source} d1_databases[0] must be an object`);
  assertExactKeys(binding, generated
    ? ["binding", "database_name", "database_id", "migrations_dir"]
    : ["binding", "database_name", "database_id"], `${source} D1 binding must stay minimal`);
  assert.equal(binding.binding, OWNER_D1_BINDING, `${source} D1 binding must be ${OWNER_D1_BINDING}`);
  assert.equal(binding.database_name, OWNER_D1_NAME, `${source} D1 database name must be ${OWNER_D1_NAME}`);
  assert.match(binding.database_id, OWNER_D1_ID, `${source} D1 database id must be a UUID`);
  assert.equal(Object.hasOwn(binding, "preview_database_id"), false,
    `${source} must not bind a remote preview D1 database`);
  if (generated) {
    assert.equal(binding.migrations_dir, "../../migrations", `${source} D1 migrations dir must be reviewed`);
  }
}

const OWNER_AI_BINDING = "AI";

function assertOwnerAiBinding(value, source) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value),
    `${source} ai must be an object`);
  assertExactKeys(value, ["binding"], `${source} AI binding must stay minimal`);
  assert.equal(value.binding, OWNER_AI_BINDING, `${source} AI binding must be ${OWNER_AI_BINDING}`);
}

function isRecursivelyEmpty(value) {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.values(value).every(isRecursivelyEmpty);
  return false;
}

function assertExactKeys(value, expectedKeys, message) {
  assert.deepEqual(new Set(Object.keys(value ?? {})), new Set(expectedKeys), message);
}

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
    matches.push(...findSessionBindings(child, childPath));
  }
  return matches;
}

export function assertWorkerPreviewConfig(config, source = "Worker config", { generated = false } = {}) {
  assert.ok(config && typeof config === "object" && !Array.isArray(config), `${source} must be an object`);

  const allowedRootKeys = generated ? generatedRootKeys : sourceRootKeys;
  const unexpectedKeys = Object.keys(config).filter((key) => !allowedRootKeys.has(key));
  assert.deepEqual(unexpectedKeys, [], `${source} contains unreviewed top-level settings`);

  const sessionBindings = findSessionBindings(config);
  assert.deepEqual(sessionBindings, [], `${source} must not contain an unrequested SESSION binding`);

  const configuredResources = resourceBindingKeys
    .filter((key) => key !== "d1_databases" && key !== "ai")
    .filter((key) => Object.hasOwn(config, key) && !isRecursivelyEmpty(config[key]));
  assert.deepEqual(configuredResources, [], `${source} must not configure unreviewed resource bindings`);
  if (Object.hasOwn(config, "d1_databases")) assertOwnerD1Binding(config.d1_databases, source, generated);
  if (Object.hasOwn(config, "ai")) assertOwnerAiBinding(config.ai, source);

  assert.equal(config.name, "coinblink-m00-local", `${source} must preserve the local-only Worker name`);
  if (generated) {
    assert.equal(config.topLevelName, "coinblink-m00-local", `${source} must retain the reviewed local-only base Worker name`);
    assert.deepEqual(config.definedEnvironments, [], `${source} must not define any production environment override`);
    assert.deepEqual(config.durable_objects, { bindings: [] }, `${source} must not configure Durable Object bindings`);
    assert.deepEqual(config.queues, { producers: [], consumers: [] }, `${source} must not configure Queue bindings`);
    assert.deepEqual(config.logfwdr, { bindings: [] }, `${source} must not configure log-forwarder bindings`);
    assert.deepEqual(config.triggers, {}, `${source} must not schedule external work`);
    assert.deepEqual(config.exports, {}, `${source} must not declare unreviewed Worker exports`);
    assert.deepEqual(config.python_modules, { exclude: ["**/*.pyc"] }, `${source} must not enable extra Worker module sources`);
    assertExactKeys(config.dev, [
      "enable_containers",
      "generate_types",
      "ip",
      "local_protocol",
      "upstream_protocol",
    ], `${source} must preserve only reviewed local development settings`);
    assert.ok(["127.0.0.1", "localhost"].includes(config.dev.ip), `${source} must bind development traffic to loopback`);
    assert.deepEqual({
      local_protocol: config.dev.local_protocol,
      upstream_protocol: config.dev.upstream_protocol,
      enable_containers: config.dev.enable_containers,
      generate_types: config.dev.generate_types,
    }, {
      local_protocol: "http",
      upstream_protocol: "http",
      enable_containers: true,
      generate_types: false,
    }, `${source} must preserve local-only development settings`);
    assert.equal(config.no_bundle, true, `${source} must preserve the adapter-generated Worker entrypoint`);
  }
  assert.equal(typeof config.main, "string", `${source} must contain the Astro Cloudflare Worker entrypoint`);
  assert.equal(typeof config.compatibility_date, "string", `${source} must pin a compatibility date`);
  assert.ok(Array.isArray(config.compatibility_flags), `${source} must include compatibility flags`);
  assert.equal(config.assets?.binding, "ASSETS", `${source} must use the approved static-assets binding`);
  assertExactKeys(config.assets, ["binding", "directory", "not_found_handling"], `${source} assets config must stay minimal`);
  assert.equal(typeof config.assets.directory, "string", `${source} assets directory must be explicit`);
  assert.equal(config.assets.not_found_handling, "404-page", `${source} must preserve the real 404 page`);
  assert.deepEqual(config.vars ?? {}, {}, `${source} must not contain unchecked production plaintext variables`);
  assert.deepEqual(config.previews, {}, `${source} must declare an empty isolated previews block with no inherited resources`);
  assert.equal(config.upload_source_maps, false, `${source} must not upload source maps to the provider`);
}
