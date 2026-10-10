#!/usr/bin/env node
/**
 * Read-only CoinBlink module-parallelism planner.
 * A plan is never an admission, worktree creation, Codex task dispatch or merge authorization.
 */
import { readFileSync, existsSync } from 'node:fs';
import { availableParallelism, freemem } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MATRIX = '.engineering/proposals/CB-GOV-PARALLEL-001-MODULE-MATRIX.json';
const CHECKPOINT = '.engineering/CHECKPOINT.json';
const ADR = 'docs/architecture/ADR-CB-0002-PARALLEL-MODULE-DELIVERY.md';

/** Calculates a safe authoring concurrency ceiling from currently available resources. */
export function localAuthoringSlots({ cpus, ramBytes }) {
  if (!Number.isInteger(cpus) || cpus < 1 || !Number.isFinite(ramBytes) || ramBytes <= 0) {
    throw new Error('Invalid resource observations');
  }
  // At least 2 logical CPUs and 4 GiB currently available RAM budgeted per concurrent author.
  // Heavy Chromium/Playwright/Docker checks must use a separate shared queue.
  return Math.max(1, Math.min(Math.floor(cpus / 2), Math.floor(ramBytes / (4 * 1024 ** 3))));
}

/** Builds a read-only plan from the canonical module matrix, checkpoint, and approved gates. */
export function planParallelModules({ matrix, checkpoint, adoptedADR = false, resourceSlots = 1, gates = {} }) {
  if (matrix.moduleCount !== 19 || matrix.modules.length !== 19) {
    throw new Error('Canonical module count is not the 19-module product catalog');
  }
  if (checkpoint.checkpointFacts.moduleAdmission['CB-M18'] !== 'FUTURE_NOT_ADMITTED') {
    throw new Error('M18 must remain FUTURE_NOT_ADMITTED');
  }
  if (!Number.isInteger(resourceSlots) || resourceSlots < 1) {
    throw new Error('resourceSlots must be a positive integer');
  }
  const ids = matrix.modules.map(item => item.id);
  const expected = Array.from({ length: 19 }, (_, i) => 'CB-M' + String(i).padStart(2, '0'));
  if (JSON.stringify(ids) !== JSON.stringify(expected)) {
    throw new Error('Module identifiers/order changed from CB-M00 through CB-M18');
  }
  const admissionIds = new Set(Object.keys(checkpoint.checkpointFacts.moduleAdmission));
  if (admissionIds.size !== expected.length || expected.some(id => !admissionIds.has(id))) {
    throw new Error('Checkpoint admission registry differs from 19 canonical module IDs');
  }
  const m00Done = checkpoint.status === 'M00_COMPLETE'
    && checkpoint.completedThroughModule === 'CB-M00'
    && checkpoint.checkpointFacts.previewDeployment === 'PREVIEW_VERIFIED';
  const completed = new Set(m00Done ? ['CB-M00'] : []);
  // Other modules are never inferred complete from an old proposal or an issue title.
  // A future orchestrator must read their separately promoted completion evidence.
  const waves = matrix.waves.filter(w => w.id !== 'G0' && w.id !== 'FUTURE');
  const candidates = waves.flatMap(wave => wave.modules.map(id => {
    const module = matrix.modules.find(x => x.id === id);
    if (!module) throw new Error('Unrecognized module in wave: ' + id);
    const unmetDependencies = module.dependencies.filter(dep => !completed.has(dep));
    const admission = checkpoint.checkpointFacts.moduleAdmission[id];
    const gate = gates[id] ?? {};
    const unfinishedExternalGates = module.externalGates.filter((_, index) => gate.externalGateApprovals?.[index] !== true);
    const workOrderPath = '.engineering/work-orders/' + id + '-WO-001.md';
    const contextLockPath = '.engineering/context-locks/' + id + '-WO-001.md';
    const contractPath = 'docs/architecture/contracts/' + id + '.md';
    const frozenSources = gate.workOrderFrozen === true && gate.contextLockFrozen === true
      && gate.contractApproved === true;
    const canImplement = m00Done && adoptedADR && admission === 'ADMITTED'
      && unmetDependencies.length === 0 && unfinishedExternalGates.length === 0 && frozenSources;
    const blockerLabels = [
      ...(!m00Done ? ['M00 not canonically complete'] : []),
      ...(!adoptedADR ? ['Global Scope/Architecture/DoD + parallel ADR not yet adopted'] : []),
      ...unmetDependencies.map(dep => 'Dependency not independently complete: ' + dep),
      ...unfinishedExternalGates.map(x => 'External evidence: ' + x),
      ...(admission !== 'ADMITTED' ? ['Module not admitted: ' + id] : []),
      ...(!frozenSources ? ['No verified Work Order + Context Lock + contract'] : []),
    ];
    return {
      id, issue: module.issue, wave: wave.id, admission,
      unmetDependencies, canImplement, blockers: blockerLabels,
      suggestedWorktree: 'cb-' + id.slice(3).toLowerCase() + '-wo-001',
      suggestedBranch: 'codex/' + id.toLowerCase() + '-wo-001',
      requiredFiles: { workOrderPath, contextLockPath, contractPath },
    };
  }));
  const ready = candidates.filter(x => x.canImplement);
  const blocked = candidates.filter(x => !x.canImplement);
  const dependencyReady = candidates.filter(x => x.unmetDependencies.length === 0);
  return {
    kind: 'READ_ONLY_NON_AUTHORIZING_PLAN',
    canonicalM00Complete: m00Done,
    checkpointPercent: checkpoint.overallCompletionPercent,
    moduleCount: 19,
    unfinishedModuleCount: m00Done ? 18 : 19,
    globalParallelADREffective: adoptedADR,
    resourceSlots,
    nextModuleCandidates: dependencyReady.map(x => x.id),
    eligibleCodeAgentsNow: ready.slice(0, resourceSlots).map(x => x.id),
    eligibleCodeAgentsWaitingForResourceSlot: ready.slice(resourceSlots).map(x => x.id),
    heavyValidationExecution: 'SERIAL_OR_BOUNDED_SEPARATE_QUEUE',
    mergePolicy: 'SERIAL_MAIN_MERGES_WITH_EXACT_HEAD_RETEST',
    candidates, blockedCount: blocked.length,
    disclaimer: 'This CLI creates no branches, worktrees, module admissions, paid resources or Codex tasks.',
  };
}

/** Reads and parses a repository JSON file relative to the planner root. */
function readJson(file) {
  return JSON.parse(readFileSync(path.join(ROOT, file), 'utf8'));
}

/** Checks only the ADR's current status line for an Owner-approved adoption. */
function detectADR() {
  if (!existsSync(path.join(ROOT, ADR))) return false;
  const doc = readFileSync(path.join(ROOT, ADR), 'utf8');
  // Read only the exact first Status line; the words ADOPTED occur in historical paragraphs.
  const statusLine = doc.split(/\r?\n/u).find(line => line.startsWith('**Status:**'));
  if (!statusLine) return false;
  const tokens = new Set(statusLine.slice('**Status:**'.length)
    .replaceAll('`', '')
    .split('/')
    .map(token => token.trim()));
  return tokens.has('ADOPTED') && tokens.has('OWNER_APPROVED')
    && !tokens.has('NOT_ADOPTED');
}

/** Parses an optional positive integer limit on eligible code agents. */
function parseMaxAgents(argv) {
  const i = argv.indexOf('--max-agents');
  if (i === -1) return null;
  if (i + 1 >= argv.length || !/^[1-9]\d*$/u.test(argv[i + 1])) {
    throw new Error('--max-agents requires a positive integer');
  }
  const parsed = Number(argv[i + 1]);
  if (!Number.isSafeInteger(parsed)) throw new Error('--max-agents exceeds the safe integer range');
  return parsed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const maxAgents = parseMaxAgents(process.argv.slice(2));
    const slots = localAuthoringSlots({ cpus: availableParallelism(), ramBytes: freemem() });
    const actualSlots = maxAgents === null ? slots : Math.min(slots, maxAgents);
    const result = planParallelModules({
      matrix: readJson(MATRIX),
      checkpoint: readJson(CHECKPOINT),
      adoptedADR: detectADR(),
      resourceSlots: actualSlots,
    });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stderr.write('CoinBlink parallel preflight BLOCKED: ' + error.message + '\n');
    process.exitCode = 1;
  }
}
