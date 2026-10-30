import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
const migration = readFileSync('migrations/0001_owner.sql', 'utf8');
const workflow = readFileSync('.github/workflows/cloudflare-production.yml', 'utf8');
const admin = readFileSync('src/pages/admin/[...route].js', 'utf8');

test('the production Worker declares exactly the reviewed owner D1 binding', () => {
  assert.equal(Array.isArray(config.d1_databases), true);
  assert.equal(config.d1_databases.length, 1);
  const binding = config.d1_databases[0];
  assert.deepEqual(Object.keys(binding).sort(), ['binding', 'database_id', 'database_name']);
  assert.equal(binding.binding, 'CMS_DB');
  assert.equal(binding.database_name, 'coinblink-cms');
  assert.match(binding.database_id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu);
  assert.equal('preview_database_id' in binding, false);
  assert.equal(JSON.stringify(config).includes("SESSION"), false);
});

test('the migration creates the owner, credential, session, draft and audit tables', () => {
  for (const table of ['cms_owner', 'cms_credentials', 'cms_challenges', 'cms_sessions',
    'cms_drafts', 'cms_draft_revisions', 'cms_bootstrap_tickets', 'cms_audit_events']) {
    assert.ok(migration.includes('CREATE TABLE ' + table + ' ('), table);
  }
  assert.match(migration, /CREATE TRIGGER cms_revision_no_update/u);
  assert.match(migration, /CREATE TRIGGER cms_audit_no_update/u);
  assert.doesNotMatch(migration, /LOCAL TEST ONLY|TEST-ONLY/iu);
});

test('main applies migrations before deploying and the admin route stays closed', () => {
  const migrationStep = workflow.indexOf('Apply owner D1 migrations');
  const deployStep = workflow.indexOf('Deploy the fixed production Worker');
  assert.ok(migrationStep > 0, 'migration step exists');
  assert.ok(deployStep > migrationStep, 'migrations run before deploy');
  assert.match(workflow.slice(migrationStep, deployStep), /d1 migrations apply coinblink-cms --remote/u);
  assert.match(admin, /if \(!import\.meta\.env\.DEV\) return unavailable\(\);/u);
});
