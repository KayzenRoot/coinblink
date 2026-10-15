import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  MAX_SYNTHETIC_PAYLOAD_BYTES,
  assertLocalD1Command,
  assertSyntheticD1Config,
  assertSyntheticPayload,
} from '../../../src/modules/CB-M05/p1a-local/guardrails.mjs';

const repositoryRoot = process.cwd();
const configRelative = 'test/modules/CB-M05/p1a-local-fixtures/wrangler.local.jsonc';
const config = JSON.parse(readFileSync(path.join(repositoryRoot, configRelative), 'utf8'));

function d1Args(overrides = []) {
  return [
    'd1', 'execute', 'CB_M05_P1A_LOCAL',
    '--local',
    '--config', configRelative,
    '--persist-to', '.wrangler/p1a-local-state/test-run/case-a',
    '--command', 'SELECT 1',
    '--json',
    ...overrides,
  ];
}

test('FAIL-01 accepts only the dedicated synthetic local D1 binding', () => {
  assert.equal(assertSyntheticD1Config(config), true);
});

test('FAIL-01 rejects any remote flag or remote config property', () => {
  assert.throws(() => assertSyntheticD1Config({ ...config, remote: true }), /remote/i);
  assert.throws(() => assertLocalD1Command(d1Args(['--remote']), { repositoryRoot, configRelative }), /remote/i);
});

test('FAIL-01 accepts only the exact D1 argument grammar and rejects alternate, duplicate, and unsafe arguments', () => {
  const context = { repositoryRoot, configRelative };
  const validFileArgs = d1Args();
  validFileArgs[validFileArgs.indexOf('--command')] = '--file';
  validFileArgs[validFileArgs.indexOf('SELECT 1')] = 'test/modules/CB-M05/p1a-local-fixtures/schema.sql';
  assert.equal(assertLocalD1Command(validFileArgs, context), true);
  const unauthorizedFileArgs = [...validFileArgs];
  unauthorizedFileArgs[9] = '../../wrangler.jsonc';
  assert.throws(() => assertLocalD1Command(unauthorizedFileArgs, context));

  for (const extraArguments of [
    ['--remote=true'], ['--remote', 'true'], ['--env=prod'], ['--env', 'prod'], ['--config=wrangler.jsonc'],
    ['--local=true'], ['--persist-to=.wrangler/p1a-local-state/other/case'], ['--command=SELECT 1'],
    ['--unknown-flag'], ['--'], ['--config', configRelative], ['--command', 'SELECT 2'],
    ['--file', 'test/modules/CB-M05/p1a-local-fixtures/seed.sql'], ['--local'], ['--json'],
  ]) {
    assert.throws(() => assertLocalD1Command(d1Args(extraArguments), context), undefined, 'must reject ' + extraArguments.join(' '));
  }

  for (const [needle, replacement] of [
    ['--config', '--config=wrangler.jsonc'],
    ['test/modules/CB-M05/p1a-local-fixtures/wrangler.local.jsonc', '--remote'],
    ['.wrangler/p1a-local-state/test-run/case-a', '../outside'],
    ['.wrangler/p1a-local-state/test-run/case-a', '.wrangler/p1a-local-state/../outside'],
    ['.wrangler/p1a-local-state/test-run/case-a', path.resolve(repositoryRoot, '.wrangler/p1a-local-state/case-a')],
    ['SELECT 1', '--remote=true'],
  ]) {
    const args = d1Args();
    args[args.indexOf(needle)] = replacement;
    assert.throws(() => assertLocalD1Command(args, context), undefined, 'must reject replacement ' + replacement);
  }
});

test('FAIL-01 rejects missing, extra, or non-synthetic database bindings', () => {
  assert.throws(() => assertSyntheticD1Config({ ...config, d1_databases: [] }), /binding/i);
  assert.throws(() => assertSyntheticD1Config({ ...config, d1_databases: [...config.d1_databases, ...config.d1_databases] }), /exactly one/i);
  const productionLike = structuredClone(config);
  productionLike.d1_databases[0].database_id = 'prod-1234567890';
  assert.throws(() => assertSyntheticD1Config(productionLike), /synthetic/i);
});

test('FAIL-01 requires --local, the fixture config, and ignored disposable persistence', () => {
  assert.equal(assertLocalD1Command(d1Args(), { repositoryRoot, configRelative }), true);
  assert.throws(() => assertLocalD1Command(d1Args().filter((arg) => arg !== '--local'), { repositoryRoot, configRelative }), /--local/i);
  assert.throws(() => assertLocalD1Command(d1Args().map((arg) => arg === '.wrangler/p1a-local-state/test-run/case-a' ? '.wrangler/other' : arg), { repositoryRoot, configRelative }), /persist/i);
});

test('FAIL-01 rejects oversized synthetic payloads before any D1 invocation', () => {
  assert.equal(assertSyntheticPayload('x'.repeat(MAX_SYNTHETIC_PAYLOAD_BYTES)), true);
  assert.throws(() => assertSyntheticPayload('x'.repeat(MAX_SYNTHETIC_PAYLOAD_BYTES + 1)), /payload/i);
  assert.throws(() => assertSyntheticPayload(null), /string/i);
});
