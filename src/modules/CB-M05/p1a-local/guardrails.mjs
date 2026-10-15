// Test-only guardrails for the admitted local synthetic proof. Never import from application routes.
import path from 'node:path';

export const MAX_SYNTHETIC_PAYLOAD_BYTES = 64 * 1024;
export const SYNTHETIC_BINDING = 'CB_M05_P1A_LOCAL';
export const SYNTHETIC_DATABASE_ID = '00000000-0000-4000-8000-000000000084';

const allowedConfigKeys = new Set(['name', 'compatibility_date', 'd1_databases']);
const allowedDatabaseKeys = new Set(['binding', 'database_name', 'database_id']);
const LOCAL_D1_CONFIG = 'test/modules/CB-M05/p1a-local-fixtures/wrangler.local.jsonc';
const LOCAL_D1_SQL_FIXTURES = new Set([
  'test/modules/CB-M05/p1a-local-fixtures/schema.sql',
  'test/modules/CB-M05/p1a-local-fixtures/seed.sql',
]);
const forbiddenKeys = new Set([
  'remote', 'account_id', 'zone_id', 'routes', 'workers_dev', 'vars', 'services',
  'queues', 'r2_buckets', 'durable_objects', 'triggers', 'secrets',
]);

function assertNoForbiddenKeys(value, location = 'config') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key.toLowerCase())) {
      throw new Error('Unsafe remote or production config key: ' + location + '.' + key);
    }
    assertNoForbiddenKeys(child, location + '.' + key);
  }
}

function assertOnlyKeys(value, allowlist, location) {
  for (const key of Object.keys(value)) {
    if (!allowlist.has(key)) throw new Error('Unexpected config key at ' + location + ': ' + key);
  }
}

export function assertSyntheticD1Config(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Synthetic D1 config must be an object');
  }
  assertNoForbiddenKeys(config);
  assertOnlyKeys(config, allowedConfigKeys, 'root');
  if (config.name !== 'coinblink-m05-p1a-synthetic-local') {
    throw new Error('Config name must identify the synthetic local fixture');
  }
  if (typeof config.compatibility_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(config.compatibility_date)) {
    throw new Error('Config requires a valid compatibility date');
  }
  if (!Array.isArray(config.d1_databases) || config.d1_databases.length !== 1) {
    throw new Error('Config must declare exactly one synthetic D1 binding');
  }
  const [database] = config.d1_databases;
  if (!database || typeof database !== 'object' || Array.isArray(database)) {
    throw new Error('Synthetic D1 binding must be an object');
  }
  assertOnlyKeys(database, allowedDatabaseKeys, 'd1_databases[0]');
  if (database.binding !== SYNTHETIC_BINDING) throw new Error('Missing expected synthetic D1 binding');
  if (database.database_name !== 'coinblink-m05-p1a-synthetic-local') {
    throw new Error('Database name must identify a synthetic local database');
  }
  if (database.database_id !== SYNTHETIC_DATABASE_ID) {
    throw new Error('Database ID must be the reserved synthetic placeholder');
  }
  return true;
}

export function assertLocalD1Command(args, { repositoryRoot, configRelative }) {
  if (!Array.isArray(args) || !args.every((arg) => typeof arg === 'string')) {
    throw new Error('D1 arguments must match the exact local allowlist grammar');
  }
  if (args.some((arg) => /^--(?:remote|preview)(?:=|$)/i.test(arg))) {
    throw new Error('Remote or preview D1 execution is forbidden');
  }
  if (args.filter((arg) => arg === '--local').length !== 1 || args[3] !== '--local') {
    throw new Error('D1 command must include exactly one --local flag');
  }
  if (
    args[4] !== '--config' || args[5] !== LOCAL_D1_CONFIG || configRelative !== LOCAL_D1_CONFIG
  ) {
    throw new Error('D1 command must use the dedicated local fixture config');
  }
  if (args.length !== 11) {
    throw new Error('D1 arguments must match the exact local allowlist grammar');
  }
  if (
    args[0] !== 'd1' || args[1] !== 'execute' || args[2] !== SYNTHETIC_BINDING ||
    args[6] !== '--persist-to' || args[10] !== '--json'
  ) {
    throw new Error('D1 arguments must match the exact local allowlist grammar');
  }
  if (typeof repositoryRoot !== 'string' || !path.isAbsolute(repositoryRoot)) {
    throw new Error('D1 repository root must be an absolute local path');
  }

  const stateRelative = args[7];
  const stateSegments = stateRelative.split(/[\\/]/);
  if (
    path.isAbsolute(stateRelative) ||
    stateSegments.length !== 4 ||
    stateSegments[0] !== '.wrangler' || stateSegments[1] !== 'p1a-local-state' ||
    stateSegments.slice(2).some((segment) => !/^[a-z0-9][a-z0-9._-]*$/i.test(segment))
  ) {
    throw new Error('D1 persistence path is outside the exact ignored local fixture root');
  }
  const resolvedRoot = path.resolve(repositoryRoot);
  const resolvedState = path.resolve(resolvedRoot, stateRelative);
  const relativeState = path.relative(resolvedRoot, resolvedState);
  if (
    !relativeState || relativeState === '..' || relativeState.startsWith('..' + path.sep) ||
    path.isAbsolute(relativeState) || relativeState.split(path.sep).join('/') !== stateRelative
  ) {
    throw new Error('D1 persistence path traverses outside the repository fixture root');
  }

  const inputFlag = args[8];
  const inputValue = args[9];
  if (!inputValue || inputValue.startsWith('-')) {
    throw new Error('D1 input values cannot be missing or look like command-line options');
  }
  if (inputFlag === '--command') {
    assertSyntheticPayload(inputValue);
  } else if (inputFlag === '--file') {
    if (!LOCAL_D1_SQL_FIXTURES.has(inputValue)) {
      throw new Error('D1 file input must be an exact authorized synthetic SQL fixture');
    }
  } else {
    throw new Error('D1 arguments must contain exactly one allowlisted SQL input');
  }
  return true;
}

export function assertSyntheticPayload(payload) {
  if (typeof payload !== 'string') throw new Error('Synthetic payload must be a string');
  if (Buffer.byteLength(payload, 'utf8') > MAX_SYNTHETIC_PAYLOAD_BYTES) {
    throw new Error('Synthetic payload exceeds the local safety limit');
  }
  return true;
}
