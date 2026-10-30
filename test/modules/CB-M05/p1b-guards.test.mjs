import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  P1B_CONFIG_PATH,
  P1B_SCHEMA_PATH,
  P1B_SYNTHETIC_BINDING,
  P1B_SYNTHETIC_DATABASE_ID,
  assertP1BLocalD1Command,
  assertP1BSyntheticD1Config,
  assertP1BSyntheticSql,
} from '../../../src/modules/CB-M05/p1b-local/d1-guardrails.mjs';

const repositoryRoot = process.cwd();
const config = JSON.parse(readFileSync(path.join(repositoryRoot, P1B_CONFIG_PATH), 'utf8'));
const stateRelative = '.wrangler/p1b-local-state/test-run/case-a';

function localArgs(inputFlag = '--file', input = P1B_SCHEMA_PATH, state = stateRelative) {
  return ['d1', 'execute', P1B_SYNTHETIC_BINDING, '--local', '--config', P1B_CONFIG_PATH, '--persist-to', state, inputFlag, input, '--json'];
}

function readTree(directory) {
  return readdirSync(directory).flatMap((name) => {
    const absolute = path.join(directory, name);
    return statSync(absolute).isDirectory() ? readTree(absolute) : [absolute];
  });
}

test('P1B SEC-01: config is an exact one-binding synthetic LOCAL identity', () => {
  assert.equal(assertP1BSyntheticD1Config(config), true);
  assert.equal(config.d1_databases[0].database_id, P1B_SYNTHETIC_DATABASE_ID);
  assert.equal(config.d1_databases[0].binding, P1B_SYNTHETIC_BINDING);
  assert.deepEqual(Object.keys(config).sort(), ['compatibility_date', 'd1_databases', 'name']);
  assert.deepEqual(Object.keys(config.d1_databases[0]).sort(), ['binding', 'database_id', 'database_name']);
});

test('P1B SEC-01: config rejects unknown, duplicate, remote, production, and malformed bindings', () => {
  for (const changed of [
    { ...config, remote: true },
    { ...config, account_id: 'test-only-but-forbidden' },
    { ...config, routes: [] },
    { ...config, d1_databases: [] },
    { ...config, d1_databases: [...config.d1_databases, ...config.d1_databases] },
    { ...config, d1_databases: [{ ...config.d1_databases[0], database_id: 'live-id' }] },
    { ...config, d1_databases: [{ ...config.d1_databases[0], binding: 'DB' }] },
    { ...config, d1_databases: [{ ...config.d1_databases[0], unexpected: true }] },
  ]) assert.throws(() => assertP1BSyntheticD1Config(changed));
  assert.throws(() => assertP1BSyntheticD1Config(null));
  assert.throws(() => assertP1BSyntheticD1Config([]));
});

test('P1B SEC-01: command guard accepts only the fixed Wrangler D1 LOCAL grammar', () => {
  const context = { repositoryRoot, configRelative: P1B_CONFIG_PATH };
  assert.equal(assertP1BLocalD1Command(localArgs(), context), true);
  assert.equal(assertP1BLocalD1Command(localArgs('--command', 'SELECT 1'), context), true);
});

test('P1B SEC-01: command guard rejects remote flags and alternate flag spellings', () => {
  const context = { repositoryRoot, configRelative: P1B_CONFIG_PATH };
  for (const args of [
    [...localArgs(), '--remote'],
    localArgs().map((arg) => arg === '--local' ? '--local=true' : arg),
    localArgs().map((arg) => arg === '--local' ? '--remote' : arg),
    localArgs().map((arg) => arg === '--config' ? '--config=test' : arg),
    localArgs().map((arg) => arg === '--persist-to' ? '--persist-to=.wrangler/p1b-local-state/test-run/case-a' : arg),
    localArgs().map((arg) => arg === '--json' ? '--json=true' : arg),
    localArgs('--command=SELECT 1', 'unused'),
    localArgs('--file', 'test/modules/CB-M05/p1b-fixtures/seed.sql'),
  ]) assert.throws(() => assertP1BLocalD1Command(args, context));
});

test('P1B SEC-01: command guard rejects unknown, duplicated, missing, and path-traversal arguments', () => {
  const context = { repositoryRoot, configRelative: P1B_CONFIG_PATH };
  for (const args of [
    [...localArgs(), '--env', 'production'],
    localArgs().flatMap((arg) => arg === '--local' ? [arg, '--local'] : [arg]),
    localArgs().filter((arg) => arg !== '--local'),
    localArgs().map((arg) => arg === stateRelative ? '.wrangler/p1b-local-state/../outside/case' : arg),
    localArgs().map((arg) => arg === stateRelative ? '..\\outside\\case\\path' : arg),
    localArgs().map((arg) => arg === stateRelative ? path.resolve(repositoryRoot, stateRelative) : arg),
    localArgs().map((arg) => arg === P1B_CONFIG_PATH ? 'wrangler.jsonc' : arg),
  ]) assert.throws(() => assertP1BLocalD1Command(args, context));
  assert.throws(() => assertP1BLocalD1Command(localArgs(), { repositoryRoot, configRelative: 'wrangler.jsonc' }));
  assert.throws(() => assertP1BLocalD1Command(localArgs(), { repositoryRoot: '.', configRelative: P1B_CONFIG_PATH }));
});

test('P1B SEC-01: command guard refuses a symlinked or junction persistence path', (t) => {
  const context = { repositoryRoot, configRelative: P1B_CONFIG_PATH };
  const stateRoot = path.join(repositoryRoot, '.wrangler', 'p1b-local-state');
  const name = 'link-' + randomUUID();
  const linkPath = path.join(stateRoot, name);
  const targetPath = path.join(stateRoot, name + '-target');
  mkdirSync(targetPath, { recursive: true });
  try {
    symlinkSync(targetPath, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    rmSync(targetPath, { recursive: true, force: true });
    t.skip('this filesystem cannot create the local symlink fixture: ' + String(error?.code || error?.name));
    return;
  }

  try {
    const state = path.relative(repositoryRoot, path.join(linkPath, 'case-a')).split(path.sep).join('/');
    assert.throws(() => assertP1BLocalD1Command(localArgs('--file', P1B_SCHEMA_PATH, state), context), /symlinks or junctions/i);
  } finally {
    rmSync(linkPath, { recursive: true, force: true });
    rmSync(targetPath, { recursive: true, force: true });
  }
});

test('P1B SEC-01: command guard bounds SQL and refuses non-string or empty payloads', () => {
  assert.equal(assertP1BSyntheticSql('SELECT 1'), true);
  assert.throws(() => assertP1BSyntheticSql(''), /empty/i);
  assert.throws(() => assertP1BSyntheticSql('x'.repeat(64 * 1024 + 1)), /bounded/i);
  assert.throws(() => assertP1BSyntheticSql(null), /bounded/i);
  assert.throws(() => assertP1BLocalD1Command(localArgs('--command', '--remote=true'), {
    repositoryRoot,
    configRelative: P1B_CONFIG_PATH,
  }));
});

test('P1B SEC-01: test harness is not imported by product modules or routed through a production D1 binding', () => {
  const productFiles = [
    ...readTree(path.join(repositoryRoot, 'src', 'pages')),
    ...readTree(path.join(repositoryRoot, 'src', 'layouts')),
    ...readTree(path.join(repositoryRoot, 'src', 'modules', 'CB-M05')).filter((file) => !file.includes(`${path.sep}p1b-local${path.sep}`)),
  ];
  for (const file of productFiles) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /p1b-local|p1b-fixtures/iu, path.relative(repositoryRoot, file));
  }
  const rootWrangler = readFileSync(path.join(repositoryRoot, 'wrangler.jsonc'), 'utf8');
  assert.match(rootWrangler, /"binding": "CMS_DB"/u);
  assert.match(rootWrangler, /"database_name": "coinblink-cms"/u);
  assert.doesNotMatch(rootWrangler, /preview_database_id|CB_M05_P1B_LOCAL|00000000-0000-4000-8000-000000000085/iu);
  assert.ok(readFileSync(path.join(repositoryRoot, P1B_SCHEMA_PATH), 'utf8').includes('TEST-') === false);
});

test('P1B SEC-01: P1B fixture files contain no private key material or external service endpoint', () => {
  const fixtureRoot = path.join(repositoryRoot, 'test', 'modules', 'CB-M05', 'p1b-fixtures');
  const fixtureText = readTree(fixtureRoot).map((file) => readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(fixtureText, /-----BEGIN (?:EC |RSA )?PRIVATE KEY-----|CLOUDFLARE_API_TOKEN|CF_API_TOKEN|api\.cloudflare\.com|--remote/iu);
  assert.deepEqual(readTree(fixtureRoot).map((file) => path.extname(file)).sort(), ['.jsonc', '.sql']);
});
