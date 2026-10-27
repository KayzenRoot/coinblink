#!/usr/bin/env node
// CB-SEC-CI-001: decide a CodeQL run from its local SARIF evidence.
//
// The blocking decision always reads EVERY result of EVERY run. Only the printed
// summary is bounded, so a finding past the print limit still gates the job. This
// is the correction for the truncation defect found in the PR #209 review.
//
// No network, no upload: the repository keeps its findings private and this script
// never sends SARIF anywhere.
import { readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PRINT_LIMIT = 20;
const DEFAULT_FAIL_AT = 7;

function sarifFiles(root) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".sarif")) found.push(full);
    }
  };
  walk(root);
  return found.sort((a, b) => a.localeCompare(b));
}

/** Severity per rule, from the tool metadata, tolerating a missing or odd value. */
function severityByRule(document) {
  const severities = new Map();
  for (const run of document.runs ?? []) {
    for (const rule of run.tool?.driver?.rules ?? []) {
      const raw = rule.properties?.["security-severity"];
      const parsed = Number.parseFloat(raw);
      if (Number.isFinite(parsed)) severities.set(rule.id, parsed);
    }
  }
  return severities;
}

function normalizePath(uri) {
  if (typeof uri !== "string" || uri === "") return "";
  let value = uri.replaceAll("\\", "/");
  value = value.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//u, "");
  value = value.split("?")[0].split("#")[0];
  if (/^[A-Za-z]:\//u.test(value)) value = value.slice(2);
  const parts = [];
  for (const segment of value.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return parts.join("/");
}

function location(result) {
  const physical = result.locations?.[0]?.physicalLocation ?? {};
  return {
    path: normalizePath(physical.artifactLocation?.uri),
    line: physical.region?.startLine,
  };
}

/** Trim the checked-out repository prefix so findings read as repo-relative paths. */
export function relativeToRepo(path, repoRoot) {
  const root = normalizePath(repoRoot);
  if (root === "" || path === "") return path;
  if (path === root) return ".";
  const prefix = root + "/";
  return path.startsWith(prefix) ? path.slice(prefix.length) : path;
}

function findingsOfRun(run, severities, repoRoot) {
  const found = [];
  for (const result of run.results ?? []) {
    const { path, line } = location(result);
    const severity = severities.get(result.ruleId);
    found.push({
      rule: result.ruleId ?? null,
      level: result.level ?? null,
      severity: Number.isFinite(severity) ? severity : null,
      path: relativeToRepo(path, repoRoot),
      line: Number.isInteger(line) ? line : null,
    });
  }
  return found;
}

function loadDocuments(files) {
  const documents = [];
  for (const file of files) {
    try {
      documents.push({ file, document: JSON.parse(readFileSync(file, "utf8")) });
    } catch (error) {
      throw new Error(`BLOCKED: unreadable SARIF evidence at ${file}: ${error.message}`, { cause: error });
    }
  }
  return documents;
}

export function readFindings(root, { repoRoot = process.cwd() } = {}) {
  const files = sarifFiles(root);
  if (files.length === 0) throw new Error("BLOCKED: CodeQL returned no local SARIF evidence");
  const findings = [];
  let resultCount = 0;
  for (const { document } of loadDocuments(files)) {
    const severities = severityByRule(document);
    for (const run of document.runs ?? []) {
      const runFindings = findingsOfRun(run, severities, repoRoot);
      resultCount += runFindings.length;
      findings.push(...runFindings);
    }
  }
  // Highest severity first, then a stable order so the summary is reproducible.
  findings.sort((a, b) => (b.severity ?? -1) - (a.severity ?? -1) ||
    a.path.localeCompare(b.path) || (a.line ?? 0) - (b.line ?? 0));
  return { findings, resultCount, files: files.length };
}

export function gate({ findings, resultCount, files }, failAt) {
  const blocking = findings.filter((finding) => (finding.severity ?? 0) >= failAt);
  return { blocking, resultCount, files };
}

export function main(argv) {
  const [root, ...rest] = argv;
  if (!root) {
    process.stderr.write("usage: codeql-findings-gate.mjs <sarif-root> [--fail-at=<severity>]\n");
    return 2;
  }
  const flag = rest.find((item) => item.startsWith("--fail-at="));
  const failAt = flag ? Number.parseFloat(flag.split("=")[1]) : DEFAULT_FAIL_AT;
  if (!Number.isFinite(failAt)) {
    process.stderr.write("--fail-at must be a number\n");
    return 2;
  }
  let report;
  try {
    report = readFindings(root);
  } catch (error) {
    process.stdout.write(`${error.message}\n`);
    return 1;
  }
  const { blocking } = gate(report, failAt);
  process.stdout.write(`CODEQL_SARIF_FILES=${report.files}\n`);
  process.stdout.write(`CODEQL_RESULTS=${report.resultCount}\n`);
  process.stdout.write(`CODEQL_FAIL_AT=${failAt}\n`);
  process.stdout.write(`CODEQL_BLOCKING=${blocking.length}\n`);
  for (const finding of report.findings.slice(0, PRINT_LIMIT)) {
    process.stdout.write(`  ${finding.severity ?? "-"} ${finding.level ?? "-"} ${finding.path}:${finding.line ?? "-"} ${finding.rule ?? "-"}\n`);
  }
  if (report.findings.length > PRINT_LIMIT) {
    process.stdout.write(`  ... ${report.findings.length - PRINT_LIMIT} more findings\n`);
  }
  if (blocking.length > 0) {
    process.stdout.write("BLOCKED: static analysis found untriaged high or critical issues\n");
    return 1;
  }
  return 0;
}

const invokedDirectly = process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) process.exitCode = main(process.argv.slice(2));
