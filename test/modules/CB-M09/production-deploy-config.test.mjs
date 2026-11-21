import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withProductionAiBinding } from '../../../scripts/add-production-ai-binding.mjs';
import { assertWorkerPreviewConfig } from '../../../scripts/worker-preview-config-safety.mjs';

// Synthetic generated config, so unit CI can validate production behaviour
// before Astro build creates dist/server/wrangler.json.
function generatedFixture() {
  const source = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
  delete source.$schema;
  return {
    ...source,
    topLevelName: source.name,
    definedEnvironments: [],
    durable_objects: { bindings: [] },
    queues: { producers: [], consumers: [] },
    logfwdr: { bindings: [] },
    triggers: {},
    exports: {},
    python_modules: { exclude: ['**/*.pyc'] },
    dev: {
      ip: '127.0.0.1', local_protocol: 'http', upstream_protocol: 'http',
      enable_containers: true, generate_types: false,
    },
    no_bundle: true,
    d1_databases: source.d1_databases.map((db) => ({ ...db, migrations_dir: '../../migrations' })),
  };
}

test('M09 generated production deploy preserves dashboard variables without activating SEO', () => {
  const preview = generatedFixture();
  assertWorkerPreviewConfig(preview, 'synthetic preview', { generated: true });
  assert.equal(Object.hasOwn(preview, 'keep_vars'), false);
  const deployed = withProductionAiBinding(preview);
  assert.equal(deployed.keep_vars, true);
  assert.deepEqual(deployed.ai, { binding: 'AI' });
  assert.deepEqual(deployed.vars ?? {}, {});
  assert.equal(Object.hasOwn(deployed.vars ?? {}, 'COINBLINK_SEO_INDEXING_ENABLED'), false);
  assert.equal(Object.hasOwn(preview, 'ai'), false);
  assert.equal(Object.hasOwn(preview, 'keep_vars'), false);
});

test('M09 rejects dashboard preservation in preview or with a malformed production binding', () => {
  const generated = withProductionAiBinding(generatedFixture());
  for (const changed of [
    { ...generated, keep_vars: false },
    { ...generated, keep_vars: 'true' },
    { ...generated, ai: { binding: 'OTHER' } },
    { ...generated, vars: { COINBLINK_SEO_INDEXING_ENABLED: 'true' } },
  ]) {
    assert.throws(() => assertWorkerPreviewConfig(changed, 'candidate', { generated: true }));
  }
  const source = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
  assert.throws(() => assertWorkerPreviewConfig({ ...source, keep_vars: true }, 'source config'));
});
