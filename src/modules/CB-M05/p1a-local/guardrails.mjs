// Test-only guardrails for the admitted local synthetic proof. Never import from application routes.
import path from 'node:path';

export const MAX_SYNTHETIC_PAYLOAD_BYTES = 64 * 1024;
export const SYNTHETIC_BINDING = 'CB_M05_P1A_LOCAL';
export const SYNTHETIC_DATABASE_ID = '00000000-0000-4000-8000-000000000084';

const allowedConfigKeys = new Set(['name', 'compatibility_date', 'd1_databases']);
const allowedDatabaseKeys = new Set(['binding', 'database_name', 'database_id']);
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
  if (!Array.isArray(args) || args.slice(0, 3).join(' ') !== 'd1 execute ' + SYNTHETIC_BINDING) {
    throw new Error('Only the dedicated synthetic D1 execute command is allowed');
  }
  if (args.includes('--remote') || args.includes('--preview')) {
    throw new Error('Remote or preview D1 execution is forbidden');
  }
  if (!args.includes('--local')) throw new Error('D1 command must include --local');
  const configIndex = args.indexOf('--config');
  if (configIndex < 0 || args[configIndex + 1] !== configRelative) {
    throw new Error('D1 command must use the dedicated local fixture config');
  }
  const persistIndex = args.indexOf('--persist-to');
  if (persistIndex < 0 || !args[persistIndex + 1]) {
    throw new Error('D1 command must use disposable local persistence');
  }
  const persistPath = path.resolve(repositoryRoot, args[persistIndex + 1]);
  const relative = path.relative(repositoryRoot, persistPath).split(path.sep).join('/');
  if (!relative.startsWith('.wrangler/p1a-local-state/')) {
    throw new Error('D1 persistence must stay under .wrangler/p1a-local-state');
  }
  if (args.includes('--account-id') || args.includes('--profile') || args.includes('--env')) {
    throw new Error('Credential, profile, and environment selectors are forbidden');
  }
  const hasCommand = args.includes('--command');
  const hasFile = args.includes('--file');
  if (hasCommand === hasFile) throw new Error('D1 command must have exactly one SQL input');
  return true;
}

export function assertSyntheticPayload(payload) {
  if (typeof payload !== 'string') throw new Error('Synthetic payload must be a string');
  if (Buffer.byteLength(payload, 'utf8') > MAX_SYNTHETIC_PAYLOAD_BYTES) {
    throw new Error('Synthetic payload exceeds the local safety limit');
  }
  return true;
}