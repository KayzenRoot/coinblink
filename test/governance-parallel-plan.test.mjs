import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const moduleMatrixPath = '.engineering/proposals/CB-GOV-PARALLEL-001-MODULE-MATRIX.json';
const contractRegisterPath = '.engineering/proposals/CB-GOV-PARALLEL-001-CONTRACT-REGISTER.json';
const contextLockPath = '.engineering/context-locks/CB-GOV-PARALLEL-001.md';
const fingerprintManifestPath = '.engineering/evidence/CB-GOV-PARALLEL-001-FINGERPRINTS.json';
const plan = JSON.parse(readFileSync(path.join(repoRoot, moduleMatrixPath), 'utf8'));
const contractRegister = JSON.parse(readFileSync(path.join(repoRoot, contractRegisterPath), 'utf8'));

function git(args, encoding = 'utf8') {
  return execFileSync('git', args, { cwd: repoRoot, encoding });
}

function parseNameStatusZ(raw) {
  const fields = raw.split('\0');
  const entries = [];

  for (let index = 0; index < fields.length - 1;) {
    const status = fields[index++];
    const changedPath = fields[index++];
    assert.ok(status && changedPath, 'NUL-delimited Git name-status record is complete');
    assert.equal(/^[RC]/u.test(status), false, 'rename/copy detection is disabled; paths are represented as separate changes');
    entries.push({ status, path: changedPath });
  }

  return entries;
}

function changedPathEntries(baseSha) {
  const raw = git(['diff', '--no-renames', '--name-status', '-z', `${baseSha}...HEAD`]);
  return parseNameStatusZ(raw);
}

function orderedWaveIndex(moduleId) {
  const module = plan.modules.find((candidate) => candidate.id === moduleId);
  return plan.waves.findIndex((wave) => wave.id === module?.wave);
}

function assertAcyclic(edges) {
  const visiting = new Set();
  const visited = new Set();

  function visit(moduleId) {
    assert.equal(visiting.has(moduleId), false, `dependency cycle reaches ${moduleId}`);
    if (visited.has(moduleId)) return;

    visiting.add(moduleId);
    for (const dependency of edges.get(moduleId) ?? []) visit(dependency);
    visiting.delete(moduleId);
    visited.add(moduleId);
  }

  for (const module of plan.modules) visit(module.id);
}

function expandOwnershipTemplate(template, module) {
  const workOrderId = module.activeWorkOrder
    ? path.posix.basename(module.activeWorkOrder, '.md')
    : module.candidateWorkOrderId;
  return template
    .replaceAll('{moduleId}', module.id)
    .replaceAll('{workOrderId}', workOrderId ?? `${module.id}-UNSCHEDULED`);
}

function normalizedPath(filePath) {
  return filePath.replaceAll('\\', '/').replace(/\/+$/u, '').toLocaleLowerCase('en-US');
}

function rootPrefix(filePattern) {
  return normalizedPath(filePattern).replace(/\*.*$/u, '').replace(/\/$/u, '');
}

function rootsOverlap(left, right) {
  const a = rootPrefix(left);
  const b = rootPrefix(right);
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

function assertUniqueNames(names, label) {
  const normalized = names.map((name) => name.toLocaleLowerCase('en-US'));
  assert.equal(new Set(normalized).size, names.length, `${label} names are unique case-insensitively`);
}

function assertNoExistingAllocation(names, existingNames, label) {
  assertUniqueNames(names, `planned ${label}`);
  const existing = new Set(existingNames.map((name) => name.toLocaleLowerCase('en-US')));
  const collision = names.find((name) => existing.has(name.toLocaleLowerCase('en-US')));
  assert.equal(collision, undefined, `${label} allocation refuses an existing name`);
}

function assertExactChangedPathSet(actualPaths, declaredPaths, manifestPath) {
  assertUniqueNames(actualPaths, 'Git changed-path');
  assertUniqueNames(declaredPaths, 'manifest');
  assert.equal(declaredPaths.includes(manifestPath), false, 'manifest does not hash itself');

  const expected = [...declaredPaths, manifestPath].map(normalizedPath).sort();
  const actual = actualPaths.map(normalizedPath).sort();
  assert.deepEqual(actual, expected, 'manifest exactly covers every changed path, including deleted and renamed paths');
}

function assertWithinAllowlist(filePath, allowedPaths) {
  const candidate = normalizedPath(filePath);
  const allowed = allowedPaths.some((pattern) => {
    const normalizedPattern = normalizedPath(pattern);
    if (normalizedPattern.endsWith('/**')) {
      const root = normalizedPattern.slice(0, -3);
      return candidate.startsWith(`${root}/`);
    }
    return candidate === normalizedPattern;
  });
  assert.equal(allowed, true, `${filePath} is owned by the active Work Order allowlist`);
}

function assertFingerprintConsistency(entry) {
  assert.equal(entry.headGitBlobSha1, entry.expectedHeadGitBlobSha1, `${entry.path} HEAD blob matches evidence`);
  assert.equal(entry.indexGitBlobSha1, entry.expectedHeadGitBlobSha1, `${entry.path} staged index blob matches HEAD`);
  assert.equal(entry.workingTreeGitBlobSha1, entry.expectedHeadGitBlobSha1, `${entry.path} worktree blob matches HEAD`);
}

function baseBlobSha256(baseSha, filePath) {
  const bytes = git(['show', `${baseSha}:${filePath}`], null);
  return createHash('sha256').update(bytes).digest('hex');
}

test('parallel governance matrix preserves exactly the existing 19 module and issue identities', () => {
  assert.equal(plan.moduleCount, 19);
  assert.equal(plan.proposalStatus, 'PROPOSED_NOT_ADOPTED');
  assert.equal(plan.modules.length, 19);
  assert.deepEqual(
    plan.modules.map((module) => module.id),
    Array.from({ length: 19 }, (_, index) => `CB-M${String(index).padStart(2, '0')}`),
  );
  assert.deepEqual(
    plan.modules.map((module) => module.issue),
    [...Array.from({ length: 17 }, (_, index) => index + 7), 27, 26],
  );
  assert.equal(new Set(plan.modules.map((module) => module.issue)).size, 19);

  for (const module of plan.modules) {
    assert.ok(existsSync(path.join(repoRoot, module.plannedWorkOrder)), `${module.id} planned WO exists`);
    assert.ok(module.title.length > 0, `${module.id} has a display name`);
  }
});

test('proposal mirrors the checkpoint admission map without inventing progress or a stopState', () => {
  const checkpoint = JSON.parse(readFileSync(path.join(repoRoot, '.engineering/CHECKPOINT.json'), 'utf8'));
  assert.deepEqual(plan.currentCheckpoint, {
    status: checkpoint.status,
    phase: checkpoint.phase,
    applicationImplementation: checkpoint.checkpointFacts.applicationImplementation,
    previewDeployment: checkpoint.checkpointFacts.previewDeployment,
    overallCompletionPercent: checkpoint.overallCompletionPercent,
    nextLegalStage: checkpoint.nextLegalStage,
  });
  assert.equal(plan.currentCheckpoint.overallCompletionPercent, 0);
  assert.equal(Object.hasOwn(checkpoint, 'stopState'), false);

  const matrixAdmissions = Object.fromEntries(plan.modules.map((module) => [
    module.id,
    module.id === 'CB-M00'
      ? 'ADMITTED'
      : module.id === 'CB-M18'
        ? 'FUTURE_NOT_ADMITTED'
        : 'NOT_ADMITTED',
  ]));
  assert.deepEqual(checkpoint.checkpointFacts.moduleAdmission, matrixAdmissions);

  for (const module of plan.modules) {
    const expectedAdmission = module.id === 'CB-M00'
      ? 'ADMITTED_IN_PROGRESS'
      : module.id === 'CB-M18'
        ? 'FUTURE_NOT_ADMITTED'
        : 'NOT_ADMITTED';
    assert.equal(module.admission, expectedAdmission, `${module.id} admission remains truthful`);
  }
  assert.equal(plan.modules.find((module) => module.id === 'CB-M18').candidateWorkOrderId, null);
});

test('module and integration dependency graphs are complete, acyclic, and wave-consistent', () => {
  const moduleIds = new Set(plan.modules.map((module) => module.id));
  const edges = new Map();

  for (const wave of plan.waves) {
    assert.equal(new Set(wave.modules).size, wave.modules.length, `${wave.id} has no duplicate modules`);
    for (const moduleId of wave.modules) {
      const module = plan.modules.find((candidate) => candidate.id === moduleId);
      assert.ok(module, `${moduleId} is in the module catalog`);
      assert.equal(module.wave, wave.id, `${moduleId} matches its wave`);
    }
  }

  const scheduledWaveIds = plan.waves.flatMap((wave) => wave.modules);
  assert.equal(new Set(scheduledWaveIds).size, 19, 'every module appears in exactly one wave');

  for (const module of plan.modules) {
    const dependencies = [...module.dependencies];
    for (const dependency of dependencies) {
      assert.ok(moduleIds.has(dependency), `${module.id} dependency ${dependency} exists`);
      assert.ok(orderedWaveIndex(dependency) < orderedWaveIndex(module.id), `${dependency} precedes ${module.id}`);
    }

    for (const gate of module.integrationGates ?? []) {
      assert.ok(moduleIds.has(gate.module), `${module.id} integration gate ${gate.module} exists`);
      dependencies.push(gate.module);
      assert.ok(gate.gate.length > 0, `${module.id} integration gate is explicit`);
    }
    edges.set(module.id, dependencies);
  }

  assertAcyclic(edges);

  const m15 = plan.modules.find((module) => module.id === 'CB-M15');
  assert.deepEqual(m15.dependencies, [
    'CB-M01', 'CB-M02', 'CB-M03', 'CB-M04', 'CB-M05', 'CB-M06', 'CB-M09', 'CB-M10', 'CB-M14',
  ]);
  assert.equal(m15.wave, 'E');

  const m17 = plan.modules.find((module) => module.id === 'CB-M17');
  assert.deepEqual(m17.dependencies, ['CB-M00', 'CB-M03', 'CB-M05']);
  assert.deepEqual(m17.integrationGates.map((gate) => gate.module), ['CB-M08', 'CB-M07']);
  assert.equal(m17.wave, 'C');
});

test('module-exclusive ownership roots are pairwise disjoint across Windows and Linux path rules', () => {
  const templates = plan.ownership.moduleExclusivePathTemplates;
  const sharedPaths = plan.ownership.integrationStewardOnlyPaths;
  const owners = [];

  for (const module of plan.modules.filter((candidate) => candidate.admission === 'NOT_ADMITTED')) {
    for (const template of templates) {
      owners.push({ module: module.id, path: expandOwnershipTemplate(template, module) });
    }
  }

  for (let i = 0; i < owners.length; i += 1) {
    for (let j = i + 1; j < owners.length; j += 1) {
      assert.equal(
        rootsOverlap(owners[i].path, owners[j].path),
        false,
        `${owners[i].module}:${owners[i].path} overlaps ${owners[j].module}:${owners[j].path}`,
      );
    }
  }

  for (const owner of owners) {
    for (const sharedPath of sharedPaths) {
      assert.equal(rootsOverlap(owner.path, sharedPath), false, `${owner.path} collides with steward ${sharedPath}`);
    }
  }

  assert.equal(rootsOverlap('SRC/Modules/CB-M01/**', 'src/modules/cb-m01/service.ts'), true);
  assert.equal(rootsOverlap('docs\\Contracts\\CB-M02.md', 'docs/contracts/cb-m02.md'), true);
});

test('future Work Order branch and worktree names are unique and refuse pre-existing allocations', () => {
  const futureModules = plan.modules.filter((module) => typeof module.candidateWorkOrderId === 'string');
  const branchNames = futureModules.map((module) => {
    const woSuffix = module.candidateWorkOrderId.toLocaleLowerCase('en-US').replace(`${module.id.toLocaleLowerCase('en-US')}-`, '');
    return plan.branchAllocation.branchPattern.replace('{nn}', module.id.slice(-2).toLocaleLowerCase('en-US')).replace('{woSuffix}', woSuffix);
  });
  const worktreeNames = futureModules.map((module) => {
    const woSuffix = module.candidateWorkOrderId.toLocaleLowerCase('en-US').replace(`${module.id.toLocaleLowerCase('en-US')}-`, '');
    return plan.branchAllocation.worktreePattern.replace('{nn}', module.id.slice(-2).toLocaleLowerCase('en-US')).replace('{woSuffix}', woSuffix);
  });

  assertUniqueNames(branchNames, 'future branch');
  assertUniqueNames(worktreeNames, 'future worktree');
  assertUniqueNames(futureModules.map((module) => module.candidateWorkOrderId), 'candidate Work Order');
  assert.equal(plan.branchAllocation.onCollision.startsWith('STOP'), true);
  assert.deepEqual(plan.branchAllocation.preflightMustInspect, [
    'local Git refs', 'remote Git refs', 'git worktree list --porcelain', 'active Work Order registry',
  ]);

  assert.doesNotThrow(() => assertNoExistingAllocation(['codex/cb-m01-wo-001'], [], 'branch'));
  assert.throws(
    () => assertNoExistingAllocation(['codex/cb-m01-wo-001'], ['CODEX/CB-M01-WO-001'], 'branch'),
    /refuses an existing name/u,
  );
  assert.throws(
    () => assertNoExistingAllocation(['cb-m01-wo-001', 'CB-M01-WO-001'], [], 'worktree'),
    /unique case-insensitively/u,
  );

  const existingBranches = git(['branch', '--all', '--format=%(refname:short)']).split(/\r?\n/u).filter(Boolean);
  assertNoExistingAllocation(branchNames, existingBranches, 'future branch');
});

test('deterministic fakes remain local and test jobs have no provider credentials', () => {
  const policy = plan.contractAndMockPolicy;
  assert.equal(policy.noExternalNetworkInMockTests, true);
  assert.equal(policy.noProviderCredentialsInTestJobs, true);
  assert.equal(policy.expectedProviderCallsInMockTests, 0);
  assert.equal(policy.separateMockAndLiveEvidence, true);
  assert.match(policy.migrationPolicy, /separately approved database ADR and Work Order/u);
  assert.match(policy.migrationPolicy, /unique migration IDs/u);
  assert.match(policy.migrationPolicy, /apply plus rollback tests against an isolated database/u);
  assert.ok(policy.mockRequirements.includes('never require or log provider secrets'));
  assert.ok(policy.mockRequirements.includes('never treat mock data as live or publishable factual data'));
});

test('contract register records proposal-only producer seams for all 19 modules without inventing approved schemas', () => {
  assert.equal(contractRegister.moduleCount, 19);
  assert.equal(contractRegister.status, 'PROPOSED_NOT_ADOPTED');
  assert.equal(contractRegister.rules.recordsDescribeCandidateSeamsOnly, true);
  assert.equal(contractRegister.rules.noRuntimeSchemasOrSharedPackagesCreated, true);
  assert.equal(contractRegister.rules.consumersCannotEditProducerContract, true);
  assert.equal(contractRegister.modules.length, 19);
  assert.deepEqual(contractRegister.modules.map((module) => module.id), plan.modules.map((module) => module.id));

  for (const module of contractRegister.modules) {
    assert.ok(module.status.length > 0, `${module.id} contract status is explicit`);
    assert.ok(module.mockSeam.length > 0, `${module.id} mock seam or no-contract state is explicit`);
    for (const surface of module.producerSurfaces) assert.ok(surface.length > 0, `${module.id} has named candidate surface`);
    for (const unresolved of module.unresolved) assert.ok(unresolved.length > 0, `${module.id} has an open decision recorded`);
  }

  const m00 = contractRegister.modules[0];
  assert.equal(m00.status, 'EXISTING_M00_SCOPE_ONLY');
  assert.match(m00.unresolved.join(' '), /no future module authority/u);
  const m18 = contractRegister.modules.at(-1);
  assert.equal(m18.status, 'FUTURE_REVIEW_ONLY_NO_CONTRACT');
  assert.deepEqual(m18.producerSurfaces, []);
  assert.match(m18.mockSeam, /no market\/token fixture/u);
});

test('Context Lock source fingerprints and external Issue snapshots are complete and traceable', () => {
  const lock = readFileSync(path.join(repoRoot, contextLockPath), 'utf8');
  assert.match(lock, new RegExp(plan.baseMainSha, 'u'));

  const sourceRows = [...lock.matchAll(/^\| `([^`]+)` \| `([a-f\d]{40})` \| `([a-f\d]{64})` \|$/gmu)]
    .map((match) => ({ path: match[1], sha1: match[2], sha256: match[3] }));
  assert.ok(sourceRows.length >= 47, 'canonical sources, active M00 locks/evidence, workflows, package inputs and all planned WOs are fingerprinted');
  assertUniqueNames(sourceRows.map((entry) => entry.path), 'Context Lock source');
  for (const entry of sourceRows) {
    assert.equal(git(['rev-parse', `${plan.baseMainSha}:${entry.path}`]).trim(), entry.sha1, `${entry.path} base Git blob matches Context Lock`);
    assert.equal(baseBlobSha256(plan.baseMainSha, entry.path), entry.sha256, `${entry.path} raw SHA-256 matches Context Lock`);
  }

  const issueRows = [...lock.matchAll(/^\| #(\d+) \| (OPEN|CLOSED) \| ([^|]+) \| `([a-f\d]{64})` \|$/gmu)];
  const issueNumbers = issueRows.map((match) => Number(match[1]));
  assert.equal(issueRows.length, 22, 'all issue #5-23, #26, #27 and #36 snapshots are recorded');
  assertUniqueNames(issueNumbers.map(String), 'external Issue');
  assert.deepEqual(issueNumbers, [...Array.from({ length: 19 }, (_, index) => index + 5), 26, 27, 36]);
});

test('current governance PR paths obey this Work Order allowlist and protected sources remain untouched', () => {
  const actualEntries = changedPathEntries(plan.integrationBaseSha);
  const actualPaths = actualEntries.map((entry) => entry.path);
  const allowed = plan.governanceChangeAllowlist;
  const workOrder = readFileSync(path.join(repoRoot, '.engineering/work-orders/CB-GOV-PARALLEL-001.md'), 'utf8');
  const scopeSection = workOrder.split('## Scope and proposed files')[1]?.split('\nNo existing canonical source')[0] ?? '';
  const workOrderPaths = [...scopeSection.matchAll(/^- `([^`]+)`/gmu)].map((match) => match[1]);

  assert.equal(plan.integrationBaseSha, plan.baseMainSha, 'this PR starts from its frozen main base');
  assert.deepEqual(git(['merge-base', plan.integrationBaseSha, 'HEAD']).trim(), plan.integrationBaseSha);
  assert.deepEqual(workOrderPaths.map(normalizedPath).sort(), allowed.map(normalizedPath).sort(), 'matrix and Work Order exact allowlists match');
  for (const entry of actualEntries) assertWithinAllowlist(entry.path, allowed);

  const allowedDeletions = plan.governanceAllowedDeletions ?? [];
  for (const entry of actualEntries.filter((candidate) => candidate.status === 'D')) {
    assert.ok(allowedDeletions.includes(entry.path), `${entry.path} deletion has a specific Work Order reason`);
  }

  const protectedPaths = [
    '.engineering/CHECKPOINT.json',
    '.engineering/CHECKPOINT.md',
    '.engineering/SOURCE-HIERARCHY.md',
    '.engineering/SCOPE.md',
    '.engineering/ARCHITECTURE.md',
    '.engineering/SECURITY.md',
    '.engineering/DEFINITION-OF-DONE.md',
    '.github/workflows/gef-validation.yml',
    'package.json',
    'package-lock.json',
    'docs/DECISIONS_LEDGER.md',
  ].map(normalizedPath);
  for (const changedPath of actualPaths) {
    assert.equal(protectedPaths.includes(normalizedPath(changedPath)), false, `${changedPath} is outside this governance delta`);
  }
});

test('fingerprint bundle exactly covers the current integration-base Git paths and verifies HEAD, index, and worktree', () => {
  const manifest = JSON.parse(readFileSync(path.join(repoRoot, fingerprintManifestPath), 'utf8'));
  assert.equal(manifest.baseMainSha, plan.baseMainSha);
  assert.equal(manifest.integrationBaseSha, plan.integrationBaseSha);
  assert.equal(manifest.workOrder, plan.workOrder);

  const manifestEntries = manifest.files;
  const manifestPaths = manifestEntries.map((entry) => entry.path);
  const actualEntries = changedPathEntries(manifest.integrationBaseSha);
  const actualPaths = actualEntries.map((entry) => entry.path);
  assertExactChangedPathSet(actualPaths, manifestPaths, fingerprintManifestPath);

  const entryByPath = new Map(manifestEntries.map((entry) => [normalizedPath(entry.path), entry]));
  for (const diffEntry of actualEntries) {
    const changedPath = diffEntry.path;
    const entry = entryByPath.get(normalizedPath(changedPath));
    assert.ok(entry, `${changedPath} is present in the manifest`);
    assert.equal(entry.status, diffEntry.status, `${changedPath} change status is recorded`);

    const absolutePath = path.join(repoRoot, changedPath);
    if (diffEntry.status === 'D') {
      assert.equal(existsSync(absolutePath), false, `${changedPath} is deleted`);
      assert.equal(entry.headGitBlobSha1, null, `${changedPath} has no HEAD blob`);
      assert.equal(entry.indexGitBlobSha1, null, `${changedPath} has no index blob`);
      assert.equal(entry.workingTreeGitBlobSha1, null, `${changedPath} has no worktree blob`);
      assert.equal(entry.workingTreeSha256, null, `${changedPath} has no worktree SHA-256`);
      assert.ok(entry.baseGitBlobSha1, `${changedPath} records its frozen-base blob`);
      assert.ok(entry.baseSha256, `${changedPath} records its frozen-base SHA-256`);
      continue;
    }

    assert.equal(existsSync(absolutePath), true, `${changedPath} exists`);
    const headSha1 = git(['rev-parse', `HEAD:${changedPath}`]).trim();
    const indexSha1 = git(['rev-parse', `:${changedPath}`]).trim();
    const workingTreeSha1 = git(['hash-object', '--', changedPath]).trim();
    const workingTreeSha256 = createHash('sha256').update(readFileSync(absolutePath)).digest('hex');
    assertFingerprintConsistency({
      path: changedPath,
      expectedHeadGitBlobSha1: entry.headGitBlobSha1,
      headGitBlobSha1: headSha1,
      indexGitBlobSha1: indexSha1,
      workingTreeGitBlobSha1: workingTreeSha1,
    });
    assert.equal(workingTreeSha256, entry.workingTreeSha256, `${changedPath} worktree SHA-256 matches evidence`);
    if (diffEntry.status === 'A') {
      assert.equal(entry.baseGitBlobSha1, null, `${changedPath} is new at the integration base`);
      assert.equal(entry.baseSha256, null, `${changedPath} has no base SHA-256`);
    } else {
      assert.equal(entry.baseGitBlobSha1, git(['rev-parse', `${manifest.integrationBaseSha}:${changedPath}`]).trim(), `${changedPath} base blob matches evidence`);
      assert.equal(entry.baseSha256, baseBlobSha256(manifest.integrationBaseSha, changedPath), `${changedPath} base SHA-256 matches evidence`);
    }
  }
});

test('exact path-set validator rejects omitted, extra, duplicate, and untracked deletion paths', () => {
  assert.doesNotThrow(() => assertExactChangedPathSet(['a.md', 'b.md'], ['a.md'], 'b.md'));
  assert.throws(() => assertExactChangedPathSet(['a.md', 'b.md'], [], 'b.md'), /exactly covers/u);
  assert.throws(() => assertExactChangedPathSet(['a.md', 'b.md', 'extra.md'], ['a.md'], 'b.md'), /exactly covers/u);
  assert.throws(() => assertExactChangedPathSet(['a.md', 'a.md'], ['a.md'], 'b.md'), /unique case-insensitively/u);
  assert.doesNotThrow(() => assertExactChangedPathSet(['old/name.md', 'new/name.md', 'b.md'], ['old/name.md', 'new/name.md'], 'b.md'));
});

test('NUL-delimited name-status parser models deletions and renames as delete-plus-add', () => {
  assert.deepEqual(parseNameStatusZ('D\0old/path.md\0A\0new/path.md\0M\0changed.md\0'), [
    { status: 'D', path: 'old/path.md' },
    { status: 'A', path: 'new/path.md' },
    { status: 'M', path: 'changed.md' },
  ]);
  assert.throws(
    () => assertExactChangedPathSet(['old/path.md', 'new/path.md', 'changed.md', 'bundle.json'], ['new/path.md', 'changed.md'], 'bundle.json'),
    /exactly covers/u,
  );
});

test('fingerprint consistency rejects staged-index and unstaged working-tree mutations', () => {
  const matching = {
    path: 'proposal.md',
    expectedHeadGitBlobSha1: 'head-hash',
    headGitBlobSha1: 'head-hash',
    indexGitBlobSha1: 'head-hash',
    workingTreeGitBlobSha1: 'head-hash',
  };
  assert.doesNotThrow(() => assertFingerprintConsistency(matching));
  assert.throws(() => assertFingerprintConsistency({ ...matching, indexGitBlobSha1: 'staged-mutation' }), /staged index/u);
  assert.throws(() => assertFingerprintConsistency({ ...matching, workingTreeGitBlobSha1: 'unstaged-mutation' }), /worktree blob/u);
});
