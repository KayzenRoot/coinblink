import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const historicalMainSha = 'e98d581c7306ab255af9b96e7c046db6f49acf12';
const integrationBaseSha = '27015adc87caacabbed0e318f892644ce0473f10';
const planPath = '.engineering/proposals/CB-GOV-PARALLEL-001-MODULE-MATRIX.json';
const checkpointPath = '.engineering/CHECKPOINT.json';
const manifestPath = '.engineering/evidence/CB-GOV-PARALLEL-001-FINGERPRINTS.json';

if (process.env.COINBLINK_VERIFY_PARALLEL_001_SNAPSHOT !== historicalMainSha) {
  throw new Error(`Set COINBLINK_VERIFY_PARALLEL_001_SNAPSHOT=${historicalMainSha} to verify only the immutable merged snapshot.`);
}

function gitBuffer(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: null });
}

function gitText(args) {
  return gitBuffer(args).toString('utf8');
}

function blobSha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function parseNameStatusZ(bytes) {
  const fields = bytes.toString('utf8').split('\0');
  const entries = [];

  for (let index = 0; index < fields.length - 1;) {
    const status = fields[index++];
    const filePath = fields[index++];
    assert.ok(status && filePath, 'historical Git name-status record is complete');
    assert.equal(/^[RC]/u.test(status), false, 'historical rename/copy detection is disabled');
    entries.push({ status, path: filePath });
  }

  return entries;
}

function normalizedPath(filePath) {
  return filePath.replaceAll('\\', '/').toLocaleLowerCase('en-US');
}

function assertExactPathSet(actualPaths, manifestPaths) {
  const normalizeAndSort = (paths) => paths.map(normalizedPath).sort();
  assert.equal(new Set(normalizeAndSort(actualPaths)).size, actualPaths.length, 'historical Git paths are unique case-insensitively');
  assert.equal(new Set(normalizeAndSort(manifestPaths)).size, manifestPaths.length, 'historical manifest paths are unique case-insensitively');
  assert.deepEqual(
    normalizeAndSort(actualPaths),
    normalizeAndSort([...manifestPaths, manifestPath]),
    'frozen PR #42 manifest exactly covers its merged path set except itself',
  );
}

const verifiedCommit = gitText(['rev-parse', historicalMainSha]).trim();
assert.equal(verifiedCommit, historicalMainSha, 'frozen historical main object is present');
const ancestry = gitText(['rev-list', '--parents', '-n', '1', historicalMainSha]).trim().split(/\s+/u);
assert.deepEqual(ancestry, [historicalMainSha, integrationBaseSha], 'historical proposal commit is based on the recorded PR #42 integration main');

const matrix = JSON.parse(gitText(['show', `${historicalMainSha}:${planPath}`]));
const checkpoint = JSON.parse(gitText(['show', `${historicalMainSha}:${checkpointPath}`]));
const manifest = JSON.parse(gitText(['show', `${historicalMainSha}:${manifestPath}`]));

assert.equal(matrix.workOrder, 'CB-GOV-PARALLEL-001');
assert.equal(matrix.baseMainSha, integrationBaseSha);
assert.equal(matrix.integrationBaseSha, integrationBaseSha);
assert.equal(manifest.workOrder, 'CB-GOV-PARALLEL-001');
assert.equal(manifest.baseMainSha, integrationBaseSha);
assert.equal(manifest.integrationBaseSha, integrationBaseSha);
assert.equal(manifest.changedGitPathCountIncludingManifest, 11);

const historicalCheckpointProjection = {
  status: checkpoint.status,
  phase: checkpoint.phase,
  applicationImplementation: checkpoint.checkpointFacts.applicationImplementation,
  previewDeployment: checkpoint.checkpointFacts.previewDeployment,
  overallCompletionPercent: checkpoint.overallCompletionPercent,
  nextLegalStage: checkpoint.nextLegalStage,
};
assert.deepEqual(matrix.currentCheckpoint, historicalCheckpointProjection, 'archived matrix records its actual immutable checkpoint snapshot');
assert.equal(checkpoint.status, 'M00_ADMITTED');
assert.equal(checkpoint.phase, 'IMPLEMENTATION_IN_PROGRESS');
assert.equal(checkpoint.overallCompletionPercent, 0);
assert.equal(Object.hasOwn(checkpoint, 'stopState'), false);
const moduleIds = Array.from({ length: 19 }, (_, index) => `CB-M${String(index).padStart(2, '0')}`);
assert.deepEqual(Object.keys(checkpoint.checkpointFacts.moduleAdmission).sort(), moduleIds.sort());
assert.equal(checkpoint.checkpointFacts.moduleAdmission['CB-M00'], 'ADMITTED');
for (const moduleId of moduleIds.slice(1, -1)) {
  assert.equal(checkpoint.checkpointFacts.moduleAdmission[moduleId], 'NOT_ADMITTED');
}
assert.equal(checkpoint.checkpointFacts.moduleAdmission['CB-M18'], 'FUTURE_NOT_ADMITTED');

const historicalChanges = parseNameStatusZ(gitBuffer([
  'diff', '--no-renames', '--name-status', '-z', `${integrationBaseSha}...${historicalMainSha}`,
]));
assertExactPathSet(historicalChanges.map((entry) => entry.path), manifest.files.map((entry) => entry.path));
assert.equal(historicalChanges.length, manifest.changedGitPathCountIncludingManifest);

const entriesByPath = new Map(manifest.files.map((entry) => [normalizedPath(entry.path), entry]));
for (const change of historicalChanges) {
  const filePath = change.path;
  if (normalizedPath(filePath) === normalizedPath(manifestPath)) continue;

  const entry = entriesByPath.get(normalizedPath(filePath));
  assert.ok(entry, `${filePath} is included in the frozen evidence bundle`);
  assert.equal(entry.status, change.status, `${filePath} historical status matches`);
  if (change.status === 'D') {
    assert.equal(entry.headGitBlobSha1, null);
    assert.equal(entry.indexGitBlobSha1, null);
    assert.equal(entry.workingTreeGitBlobSha1, null);
    assert.equal(entry.workingTreeSha256, null);
    assert.equal(gitText(['rev-parse', `${integrationBaseSha}:${filePath}`]).trim(), entry.baseGitBlobSha1);
    assert.equal(blobSha256(gitBuffer(['show', `${integrationBaseSha}:${filePath}`])), entry.baseSha256);
    continue;
  }

  const snapshotBlobSha1 = gitText(['rev-parse', `${historicalMainSha}:${filePath}`]).trim();
  const snapshotBytes = gitBuffer(['show', `${historicalMainSha}:${filePath}`]);
  assert.equal(entry.headGitBlobSha1, snapshotBlobSha1, `${filePath} frozen HEAD blob SHA-1 matches`);
  assert.equal(entry.indexGitBlobSha1, snapshotBlobSha1, `${filePath} frozen index SHA-1 matches the merged tree`);
  assert.equal(entry.workingTreeGitBlobSha1, snapshotBlobSha1, `${filePath} frozen worktree SHA-1 matches the merged tree`);
  assert.equal(entry.workingTreeSha256, blobSha256(snapshotBytes), `${filePath} frozen raw SHA-256 matches`);

  if (change.status === 'A') {
    assert.equal(entry.baseGitBlobSha1, null);
    assert.equal(entry.baseSha256, null);
  } else {
    assert.equal(gitText(['rev-parse', `${integrationBaseSha}:${filePath}`]).trim(), entry.baseGitBlobSha1);
    assert.equal(blobSha256(gitBuffer(['show', `${integrationBaseSha}:${filePath}`])), entry.baseSha256);
  }
}

process.stdout.write(`PASS archived CB-GOV-PARALLEL-001 evidence at ${historicalMainSha}: ${historicalChanges.length} paths and ${manifest.files.length} SHA-1/SHA-256 fingerprint records.\n`);
