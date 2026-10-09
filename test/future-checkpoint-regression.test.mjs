import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('evergreen governance tests pass after unrelated work and a later checkpoint delta', {
  skip: process.env.COINBLINK_SKIP_FUTURE_CHECKPOINT_REGRESSION === '1',
}, (t) => {
  const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'coinblink-future-checkpoint-'));
  const checkout = path.join(temporaryRoot, 'checkout');
  t.after(() => rmSync(temporaryRoot, { recursive: true, force: true }));

  execFileSync('git', ['clone', '--shared', '--quiet', repoRoot, checkout], { stdio: 'pipe' });

  for (const testFile of [
    'test/governance-parallel-plan.test.mjs',
    'test/gef-cli.test.mjs',
    'test/future-checkpoint-regression.test.mjs',
  ]) {
    cpSync(path.join(repoRoot, testFile), path.join(checkout, testFile));
  }

  const sourceNodeModules = path.join(repoRoot, 'node_modules');
  assert.equal(existsSync(sourceNodeModules), true, 'local dependencies are installed for the isolated test checkout');
  const targetNodeModules = path.join(checkout, 'node_modules');
  symlinkSync(sourceNodeModules, targetNodeModules, process.platform === 'win32' ? 'junction' : 'dir');

  const checkpointPath = path.join(checkout, '.engineering', 'CHECKPOINT.json');
  const checkpoint = JSON.parse(readFileSync(checkpointPath, 'utf8'));
  // Synthetic schema-valid fixture only: it models a later M00 closure and M01 admission.
  // It is committed only inside this disposable clone and is never canonical project evidence.
  checkpoint.status = 'M00_COMPLETE';
  checkpoint.phase = 'IMPLEMENTATION_COMPLETE';
  checkpoint.completedThroughModule = 'CB-M00';
  checkpoint.overallCompletionPercent = 10;
  checkpoint.nextLegalStage = 'IMPLEMENT_CB_M01_AFTER_ADMISSION';
  checkpoint.checkpointFacts.applicationImplementation = 'M00_COMPLETE';
  checkpoint.checkpointFacts.previewDeployment = 'PREVIEW_VERIFIED';
  checkpoint.checkpointFacts.activeWorkOrder = 'CB-M01-WO-001';
  checkpoint.checkpointFacts.moduleAdmission['CB-M01'] = 'ADMITTED';
  checkpoint.progressBasis.overallCompletionPercent = 10;
  writeFileSync(checkpointPath, `${JSON.stringify(checkpoint, null, 2)}\n`);

  const unrelatedPath = path.join(checkout, 'docs', 'test-fixtures', 'future-work-order.md');
  mkdirSync(path.dirname(unrelatedPath), { recursive: true });
  writeFileSync(unrelatedPath, 'Synthetic unrelated future-work file; not product evidence.\n');

  const runGit = (args) => execFileSync('git', args, { cwd: checkout, stdio: 'pipe' });
  runGit(['config', 'user.name', 'CoinBlink Test Fixture']);
  runGit(['config', 'user.email', 'coinblink-fixture@example.invalid']);
  runGit(['add', '--', '.engineering/CHECKPOINT.json', 'docs/test-fixtures/future-work-order.md']);
  execFileSync('git', [
    '-c', 'user.name=CoinBlink Test Fixture',
    '-c', 'user.email=coinblink-fixture@example.invalid',
    'commit', '--quiet', '-m', 'test: create synthetic future checkpoint fixture',
  ], {
    cwd: checkout,
    stdio: 'pipe',
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: '2026-10-09T00:00:00+00:00',
      GIT_COMMITTER_DATE: '2026-10-09T00:00:00+00:00',
    },
  });

  const childEnvironment = { ...process.env, COINBLINK_SKIP_FUTURE_CHECKPOINT_REGRESSION: '1' };
  delete childEnvironment.NODE_TEST_CONTEXT;
  const result = spawnSync(process.execPath, [
    '--test',
    'test/governance-parallel-plan.test.mjs',
    'test/gef-cli.test.mjs',
  ], {
    cwd: checkout,
    encoding: 'utf8',
    timeout: 120_000,
    windowsHide: true,
    env: childEnvironment,
  });

  assert.equal(result.error, undefined, 'synthetic evergreen test runner starts');
  const childOutput = `${result.stdout}\n${result.stderr}`;
  assert.match(childOutput, /parallel governance matrix preserves exactly the existing 19 module and issue identities/u);
  assert.match(childOutput, /preflight validates the post-merge M00 checkpoint/u);
  assert.equal(
    result.status,
    0,
    `affected evergreen tests pass at synthetic future HEAD ${runGit(['rev-parse', 'HEAD']).toString().trim()}\n${childOutput}`,
  );
});
