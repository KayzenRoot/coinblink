// The P1B test process can only invoke the fixed synthetic Wrangler LOCAL D1 fixture.
import { lstatSync } from 'node:fs';
import path from 'node:path';

export const P1B_SYNTHETIC_BINDING = 'CB_M05_P1B_LOCAL';
export const P1B_SYNTHETIC_DATABASE_ID = '00000000-0000-4000-8000-000000000085';
export const P1B_CONFIG_PATH = 'test/modules/CB-M05/p1b-fixtures/wrangler.local.jsonc';
export const P1B_SCHEMA_PATH = 'test/modules/CB-M05/p1b-fixtures/schema.sql';
export const P1B_MAX_SQL_BYTES = 64 * 1024;

const allowedRootKeys = new Set(['name', 'compatibility_date', 'd1_databases']);
const allowedBindingKeys = new Set(['binding', 'database_name', 'database_id']);
const allowedSqlFixtures = new Set([P1B_SCHEMA_PATH]);

function exactKeys(value, allowlist, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(label + ' must be an object');
  for (const key of Object.keys(value)) {
    if (!allowlist.has(key)) throw new Error('Unexpected ' + label + ' property: ' + key);
  }
}

export function assertP1BSyntheticD1Config(config) {
  exactKeys(config, allowedRootKeys, 'D1 config');
  if (config.name !== 'coinblink-m05-p1b-synthetic-local') throw new Error('D1 config name is not the P1B synthetic fixture');
  if (typeof config.compatibility_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(config.compatibility_date)) {
    throw new Error('D1 config requires a fixed compatibility date');
  }
  if (!Array.isArray(config.d1_databases) || config.d1_databases.length !== 1) {
    throw new Error('D1 config must contain exactly one synthetic binding');
  }
  const [binding] = config.d1_databases;
  exactKeys(binding, allowedBindingKeys, 'D1 binding');
  if (binding.binding !== P1B_SYNTHETIC_BINDING || binding.database_name !== 'coinblink-m05-p1b-synthetic-local' || binding.database_id !== P1B_SYNTHETIC_DATABASE_ID) {
    throw new Error('D1 config binding must match the reserved P1B synthetic identity');
  }
  return true;
}

export function assertP1BSyntheticSql(sql) {
  if (typeof sql !== 'string' || Buffer.byteLength(sql, 'utf8') > P1B_MAX_SQL_BYTES) {
    throw new Error('P1B SQL payload must be a bounded local string');
  }
  if (!sql.trim()) throw new Error('P1B SQL payload cannot be empty');
  return true;
}

function assertNoStateSymlinks(repositoryRoot, stateRelative) {
  let current = path.resolve(repositoryRoot);
  for (const segment of stateRelative.split(/[\\/]/)) {
    current = path.join(current, segment);
    try {
      if (lstatSync(current).isSymbolicLink()) {
        throw new Error('P1B D1 persistence path must not contain symlinks or junctions');
      }
    } catch (error) {
      if (error?.code === 'ENOENT') break;
      throw error;
    }
  }
}

export function assertP1BLocalD1Command(args, { repositoryRoot, configRelative = P1B_CONFIG_PATH } = {}) {
  if (!Array.isArray(args) || !args.every((arg) => typeof arg === 'string')) {
    throw new Error('P1B Wrangler arguments must be strings');
  }
  if (args.some((arg) => /^--(?:remote|preview)(?:=|$)/i.test(arg))) {
    throw new Error('Remote or preview D1 execution is forbidden');
  }
  if (!path.isAbsolute(repositoryRoot ?? '')) throw new Error('P1B repository root must be absolute');
  if (configRelative !== P1B_CONFIG_PATH) throw new Error('P1B D1 config path is not allowlisted');
  if (args.length !== 11 ||
      args[0] !== 'd1' || args[1] !== 'execute' || args[2] !== P1B_SYNTHETIC_BINDING ||
      args[3] !== '--local' || args[4] !== '--config' || args[5] !== P1B_CONFIG_PATH ||
      args[6] !== '--persist-to' || args[10] !== '--json') {
    throw new Error('P1B Wrangler arguments do not match the exact LOCAL allowlist');
  }

  const stateRelative = args[7];
  const stateSegments = stateRelative.split(/[\\/]/);
  if (path.isAbsolute(stateRelative) || stateSegments.length !== 4 ||
      stateSegments[0] !== '.wrangler' || stateSegments[1] !== 'p1b-local-state' ||
      stateSegments.slice(2).some((segment) => !/^[a-z0-9][a-z0-9._-]*$/i.test(segment))) {
    throw new Error('P1B persistence path is outside the ignored LOCAL fixture directory');
  }
  const resolvedRoot = path.resolve(repositoryRoot);
  const resolvedState = path.resolve(resolvedRoot, stateRelative);
  const relativeState = path.relative(resolvedRoot, resolvedState);
  if (!relativeState || relativeState === '..' || relativeState.startsWith('..' + path.sep) ||
      path.isAbsolute(relativeState) || relativeState.split(path.sep).join('/') !== stateRelative) {
    throw new Error('P1B persistence path escapes the repository fixture directory');
  }
  assertNoStateSymlinks(resolvedRoot, stateRelative);

  const inputFlag = args[8];
  const input = args[9];
  if (inputFlag === '--file') {
    if (!allowedSqlFixtures.has(input)) throw new Error('P1B SQL file is not allowlisted');
  } else if (inputFlag === '--command') {
    assertP1BSyntheticSql(input);
  } else {
    throw new Error('P1B D1 requires exactly one allowlisted SQL input');
  }
  return true;
}
