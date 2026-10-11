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
const GITHUB_API = 'https://api.github.com/repos/KayzenRoot/coinblink';
const ADR = 'docs/architecture/ADR-CB-0002-PARALLEL-MODULE-DELIVERY.md';
const GLOBAL_SOURCE_APPROVALS = [
  ['scopeApproved', '.engineering/SCOPE.md'],
  ['architectureApproved', '.engineering/ARCHITECTURE.md'],
  ['dodApproved', '.engineering/DEFINITION-OF-DONE.md'],
];
const GLOBAL_GATE_LABELS = {
  scopeApproved: 'global Scope approval',
  architectureApproved: 'global Architecture approval',
  dodApproved: 'global DoD approval',
  issue6Closed: 'Issue #6 global gate closure',
  parallelADRAdopted: 'parallel-delivery ADR adoption',
};

/** Calculates a safe authoring concurrency ceiling from currently available resources. */
export function localAuthoringSlots({ cpus, ramBytes }) {
  if (!Number.isInteger(cpus) || cpus < 1 || !Number.isFinite(ramBytes) || ramBytes <= 0) {
    throw new Error('Invalid resource observations');
  }
  // At least 2 logical CPUs and 4 GiB currently available RAM budgeted per concurrent author.
  // Heavy Chromium/Playwright/Docker checks must use a separate shared queue.
  return Math.min(Math.floor(cpus / 2), Math.floor(ramBytes / (4 * 1024 ** 3)));
}

/** Builds a read-only plan from the canonical module matrix, checkpoint, and approved gates. */
export function planParallelModules({ matrix, checkpoint, canonicalCheckpoint, canonicalMainSha, globalGates = {}, resourceSlots = 1, gates = {} }) {
  if (matrix.moduleCount !== 19 || matrix.modules.length !== 19) {
    throw new Error('Canonical module count is not the 19-module product catalog');
  }
  if (!isCoinBlinkCheckpoint(checkpoint)) {
    throw new Error('Candidate checkpoint must use the CoinBlink schema v2 identity');
  }
  if (!isCoinBlinkCheckpoint(canonicalCheckpoint)) {
    throw new Error('Canonical main checkpoint must use the CoinBlink schema v2 identity');
  }
  if (typeof canonicalMainSha !== 'string' || !/^[a-f0-9]{40}$/u.test(canonicalMainSha)) {
    throw new Error('Canonical main checkpoint SHA is missing or invalid');
  }
  if (!Number.isInteger(resourceSlots) || resourceSlots < 0) {
    throw new Error('resourceSlots must be a non-negative integer');
  }
  const ids = matrix.modules.map(item => item.id);
  const expected = Array.from({ length: 19 }, (_, i) => 'CB-M' + String(i).padStart(2, '0'));
  if (JSON.stringify(ids) !== JSON.stringify(expected)) {
    throw new Error('Module identifiers/order changed from CB-M00 through CB-M18');
  }
  for (const [label, source] of [['candidate', checkpoint], ['canonical main', canonicalCheckpoint]]) {
    const admissionRegistry = source?.checkpointFacts?.moduleAdmission;
    const admissionIds = new Set(isRecord(admissionRegistry) ? Object.keys(admissionRegistry) : []);
    if (admissionIds.size !== expected.length || expected.some(id => !admissionIds.has(id))) {
      throw new Error(`${label} checkpoint admission registry differs from 19 canonical module IDs`);
    }
  }
  if (canonicalCheckpoint.checkpointFacts.moduleAdmission['CB-M18'] !== 'FUTURE_NOT_ADMITTED') {
    throw new Error('M18 must remain FUTURE_NOT_ADMITTED in canonical main');
  }
  const facts = canonicalCheckpoint.checkpointFacts;
  const m00Done = canonicalCheckpoint.status === 'M00_COMPLETE'
    && facts.applicationImplementation === 'M00_COMPLETE'
    && facts.previewDeployment === 'PREVIEW_VERIFIED'
    && facts.moduleAdmission['CB-M00'] === 'ADMITTED';
  const completed = new Set(m00Done ? ['CB-M00'] : []);
  const pendingGlobalGates = Object.keys(GLOBAL_GATE_LABELS)
    .filter(key => globalGates[key] !== true);
  const globalGatesSatisfied = pendingGlobalGates.length === 0;
  // Other modules are never inferred complete from an old proposal or an issue title.
  // A future orchestrator must read their separately promoted completion evidence.
  const waves = matrix.waves.filter(w => w.id !== 'G0' && w.id !== 'FUTURE');
  const candidates = waves.flatMap(wave => wave.modules.map(id => {
    const module = matrix.modules.find(x => x.id === id);
    if (!module) throw new Error('Unrecognized module in wave: ' + id);
    const unmetDependencies = module.dependencies.filter(dep => !completed.has(dep));
    const candidateAdmission = checkpoint.checkpointFacts.moduleAdmission[id];
    const admission = facts.moduleAdmission[id];
    const gate = gates[id] ?? {};
    const unfinishedExternalGates = module.externalGates.filter((_, index) => gate.externalGateApprovals?.[index] !== true);
    const integrationBlockers = (module.integrationGates ?? [])
      .filter((_, index) => gate.integrationGateApprovals?.[index] !== true)
      .map(item => `Integration contract ${item.module}: ${item.gate}`);
    const workOrderPath = '.engineering/work-orders/' + id + '-WO-001.md';
    const contextLockPath = '.engineering/context-locks/' + id + '-WO-001.md';
    const contractPath = 'docs/architecture/contracts/' + id + '.md';
    const frozenSources = gate.workOrderFrozen === true && gate.contextLockFrozen === true
      && gate.contractApproved === true;
    const plannerEligibleBasedOnEvaluatedInputs = m00Done && globalGatesSatisfied && admission === 'ADMITTED'
      && unmetDependencies.length === 0 && unfinishedExternalGates.length === 0 && frozenSources;
    const blockerLabels = [
      ...(!m00Done ? ['M00 not canonically complete'] : []),
      ...pendingGlobalGates.map(key => `Global gate pending: ${key} (${GLOBAL_GATE_LABELS[key]})`),
      ...unmetDependencies.map(dep => 'Dependency not independently complete: ' + dep),
      ...unfinishedExternalGates.map(x => 'External evidence: ' + x),
      ...(admission !== 'ADMITTED' ? ['Module not admitted in canonical main: ' + id] : []),
      ...(!frozenSources ? ['No verified Work Order + Context Lock + contract'] : []),
    ];
    return {
      id, issue: module.issue, wave: wave.id, admission, candidateAdmission,
      unmetDependencies, plannerEligibleBasedOnEvaluatedInputs,
      blockers: blockerLabels, integrationBlockers,
      suggestedWorktree: 'cb-' + id.slice(3).toLowerCase() + '-wo-001',
      suggestedBranch: 'codex/' + id.toLowerCase() + '-wo-001',
      requiredFiles: { workOrderPath, contextLockPath, contractPath },
    };
  }));
  const plannerEligible = candidates.filter(x => x.plannerEligibleBasedOnEvaluatedInputs);
  const blocked = candidates.filter(x => !x.plannerEligibleBasedOnEvaluatedInputs);
  const dependencyReady = candidates.filter(x => x.unmetDependencies.length === 0);
  return {
    kind: 'READ_ONLY_NON_AUTHORIZING_PLAN',
    canonicalM00Complete: m00Done,
    checkpointPercent: canonicalCheckpoint.overallCompletionPercent,
    candidateCheckpointPercent: checkpoint.overallCompletionPercent,
    canonicalMainSha,
    moduleCount: 19,
    unfinishedModuleCount: m00Done ? 18 : 19,
    globalGatesSatisfied,
    pendingGlobalGates: pendingGlobalGates.map(key => GLOBAL_GATE_LABELS[key]),
    globalParallelADREffective: globalGates.parallelADRAdopted === true,
    resourceSlots,
    dependencyReadyModuleCandidates: dependencyReady.map(x => x.id),
    plannerEligibleAgentModulesWithinResourceSlots: plannerEligible.slice(0, resourceSlots).map(x => x.id),
    plannerEligibleAgentModulesWaitingForResourceSlots: plannerEligible.slice(resourceSlots).map(x => x.id),
    moduleApplicationCodeAuthorizedByPlanner: false,
    heavyValidationExecution: 'SERIAL_OR_BOUNDED_SEPARATE_QUEUE',
    mergePolicy: 'SERIAL_MAIN_MERGES_WITH_EXACT_HEAD_RETEST',
    candidates, blockedCount: blocked.length,
    disclaimer: 'This CLI creates no branches, worktrees, module admissions, paid resources or Codex tasks and never grants application-code authority; planner eligibility is conditional on the evaluated inputs.',
  };
}

/** Reads and parses a repository JSON file relative to the planner root. */
function readJson(file) {
  return JSON.parse(readFileSync(path.join(ROOT, file), 'utf8'));
}

const GATE_EVIDENCE_FIELDS = new Set([
  'externalGateApprovals', 'integrationGateApprovals',
  'workOrderFrozen', 'contextLockFrozen', 'contractApproved',
]);
const ARRAY_GATE_EVIDENCE_FIELDS = new Set(['externalGateApprovals', 'integrationGateApprovals']);

/** Returns whether a JSON value is a non-null, non-array record. */
function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Validates the fixed GEF project checkpoint identity used by this planner. */
function isCoinBlinkCheckpoint(value) {
  return isRecord(value) && value.schemaVersion === 2 && value.project === 'CoinBlink'
    && isRecord(value.checkpointFacts);
}

/** Validates one explicit module gate value. */
function validateGateEvidenceField(key, value) {
  if (!GATE_EVIDENCE_FIELDS.has(key)) throw new TypeError('Unknown gate evidence field: ' + key);
  if (ARRAY_GATE_EVIDENCE_FIELDS.has(key)) {
    const validBooleanArray = Array.isArray(value) && value.every(item => typeof item === 'boolean');
    if (!validBooleanArray) throw new TypeError(key + ' must be an array of boolean values');
    return;
  }
  if (typeof value !== 'boolean') throw new TypeError(key + ' must be a boolean');
}

/** Validates the gate evidence for one supported, already-planned module. */
function validateGateEvidenceEntry(id, gates) {
  if (!/^CB-M(?:0[1-9]|1[0-7])$/u.test(id)) {
    throw new TypeError('Gate evidence contains an unsupported module ID: ' + id);
  }
  if (!isRecord(gates)) throw new TypeError('Gate evidence for ' + id + ' must be an object');
  for (const [key, value] of Object.entries(gates)) validateGateEvidenceField(key, value);
}

/** Parses operator-supplied planning evidence without treating it as authorization. */
export function parseGateEvidence(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SyntaxError('Gate evidence must be valid JSON');
  }
  if (!isRecord(parsed)) throw new TypeError('Gate evidence must be an object keyed by module ID');
  for (const [id, gates] of Object.entries(parsed)) validateGateEvidenceEntry(id, gates);
  return parsed;
}

/** Reads one explicitly labeled status value and strips its Markdown formatting. */
function readExactStatusValue(document, prefix) {
  if (typeof document !== 'string') return null;
  const statusLine = document.split(/\r?\n/u).find(line => line.startsWith(prefix));
  if (!statusLine) return null;
  const statusText = statusLine.slice(prefix.length);
  const closingMarker = statusText.indexOf('**');
  return (closingMarker === -1 ? statusText : statusText.slice(0, closingMarker))
    .replaceAll('`', '')
    .trim()
    .replace(/\.$/u, '')
    .trim();
}

/** Returns true only for a status line explicitly recording global approval and freeze. */
export function isGlobalApprovalStatus(document) {
  return readExactStatusValue(document, '**Status:') === 'OWNER_APPROVED_GLOBAL / FROZEN';
}

/** Reads a source document and checks its explicit global-approval status line. */
function hasGlobalApprovalStatus(file) {
  if (!existsSync(path.join(ROOT, file))) return false;
  return isGlobalApprovalStatus(readFileSync(path.join(ROOT, file), 'utf8'));
}

/** Accepts only the exact current status for Owner-approved ADR adoption. */
export function isParallelAdrApproved(document) {
  return readExactStatusValue(document, '**Status:**') === 'ADOPTED / OWNER_APPROVED';
}

/** Checks only the ADR's current status line for an Owner-approved adoption. */
function detectADR() {
  if (!existsSync(path.join(ROOT, ADR))) return false;
  // Read only the exact first Status line; the words ADOPTED occur in historical paragraphs.
  return isParallelAdrApproved(readFileSync(path.join(ROOT, ADR), 'utf8'));
}

/** Reads the public Issue #6 state without credentials; errors fail closed. */
export async function isIssue6Closed(fetchImplementation = fetch) {
  try {
    const response = await fetchImplementation('https://api.github.com/repos/KayzenRoot/coinblink/issues/6', {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'CoinBlink-Parallel-Readiness',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const issue = await response.json();
    return issue.number === 6 && issue.state === 'closed' && !issue.pull_request;
  } catch {
    return false;
  }
}

/** Reads the current canonical main ref and its checkpoint through fixed unauthenticated GitHub API GETs. */
export async function readCanonicalMainCheckpoint(fetchImplementation = fetch) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'CoinBlink-Parallel-Readiness',
    'Cache-Control': 'no-cache',
  };
  try {
    const refResponse = await fetchImplementation(`${GITHUB_API}/git/ref/heads/main`, {
      headers, redirect: 'error', signal: AbortSignal.timeout(5000),
    });
    if (!refResponse.ok) return null;
    const ref = await refResponse.json();
    const sha = ref?.object?.sha;
    if (ref?.ref !== 'refs/heads/main' || ref?.object?.type !== 'commit'
      || typeof sha !== 'string' || !/^[a-f0-9]{40}$/u.test(sha)) return null;

    const contentResponse = await fetchImplementation(
      `${GITHUB_API}/contents/${CHECKPOINT}?ref=${encodeURIComponent(sha)}`,
      { headers, redirect: 'error', signal: AbortSignal.timeout(5000) },
    );
    if (!contentResponse.ok) return null;
    const file = await contentResponse.json();
    const encoded = typeof file?.content === 'string' ? file.content.replace(/\s/gu, '') : '';
    if (file?.type !== 'file' || file?.path !== CHECKPOINT || file?.encoding !== 'base64'
      || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(encoded)) return null;

    const parsed = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    if (!isCoinBlinkCheckpoint(parsed) || !isRecord(parsed.checkpointFacts.moduleAdmission)) return null;
    return { sha, checkpoint: parsed };
  } catch {
    return null;
  }
}

/** Reads the five independent global gates; unavailable GitHub state fails closed. */
async function readGlobalGates() {
  const globalGates = Object.fromEntries(
    GLOBAL_SOURCE_APPROVALS.map(([key, file]) => [key, hasGlobalApprovalStatus(file)]),
  );
  globalGates.issue6Closed = await isIssue6Closed();
  globalGates.parallelADRAdopted = detectADR();
  return globalGates;
}

/** Parses an optional non-negative integer limit on eligible code agents. */
function parseMaxAgents(argv) {
  const i = argv.indexOf('--max-agents');
  if (i === -1) return null;
  if (i + 1 >= argv.length || !/^(?:0|[1-9]\d*)$/u.test(argv[i + 1])) {
    throw new Error('--max-agents requires a non-negative integer');
  }
  const parsed = Number(argv[i + 1]);
  if (!Number.isSafeInteger(parsed)) throw new Error('--max-agents exceeds the safe integer range');
  return parsed;
}

/** Parses an optional path containing explicitly supplied, non-authorizing gate evidence. */
function parseGateEvidencePath(argv) {
  const i = argv.indexOf('--gate-evidence');
  if (i === -1) return null;
  if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
    throw new Error('--gate-evidence requires a JSON file path');
  }
  return argv[i + 1];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const maxAgents = parseMaxAgents(process.argv.slice(2));
    const gateEvidencePath = parseGateEvidencePath(process.argv.slice(2));
    const slots = localAuthoringSlots({ cpus: availableParallelism(), ramBytes: freemem() });
    const actualSlots = maxAgents === null ? slots : Math.min(slots, maxAgents);
    const gates = gateEvidencePath === null ? {} : parseGateEvidence(
      readFileSync(path.resolve(ROOT, gateEvidencePath), 'utf8'),
    );
    const canonicalMain = await readCanonicalMainCheckpoint();
    if (!canonicalMain) throw new Error('Canonical main checkpoint could not be verified from GitHub; module eligibility is blocked');
    const result = planParallelModules({
      matrix: readJson(MATRIX),
      checkpoint: readJson(CHECKPOINT),
      canonicalCheckpoint: canonicalMain.checkpoint,
      canonicalMainSha: canonicalMain.sha,
      globalGates: await readGlobalGates(),
      resourceSlots: actualSlots,
      gates,
    });
    result.gateEvidenceProvided = gateEvidencePath !== null;
    result.gateEvidenceTrust = 'UNVERIFIED_OPERATOR_INPUT_NOT_AUTHORIZATION';
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stderr.write('CoinBlink parallel preflight BLOCKED: ' + error.message + '\n');
    process.exitCode = 1;
  }
}
