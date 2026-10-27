import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GATE = resolve(fileURLToPath(new URL("../../scripts/security/codeql-findings-gate.mjs", import.meta.url)));
const { readFindings, gate } = await import(new URL("../../scripts/security/codeql-findings-gate.mjs", import.meta.url).href);

function result(rule, uri, line = 1) {
  return {
    ruleId: rule,
    level: "error",
    locations: [{ physicalLocation: { artifactLocation: { uri }, region: { startLine: line } } }],
    message: { text: "synthetic" },
  };
}

function sarif(rules, results) {
  return {
    runs: [{
      tool: { driver: { name: "CodeQL", rules } },
      results,
    }],
  };
}

function rule(id, severity) {
  return { id, properties: { "security-severity": severity } };
}

function withSarif(files, body) {
  const root = mkdtempSync(join(tmpdir(), "cb-sarif-"));
  try {
    for (const [name, content] of Object.entries(files)) {
      const full = join(root, name);
      mkdirSync(join(full, ".."), { recursive: true });
      writeFileSync(full, typeof content === "string" ? content : JSON.stringify(content));
    }
    return body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function runGate(root) {
  try {
    return { code: 0, output: execFileSync(process.execPath, [GATE, root], { encoding: "utf8" }) };
  } catch (error) {
    return { code: error.status, output: String(error.stdout) };
  }
}

test("CB-SEC-CI-001 refuses to pass without local SARIF evidence", () => {
  withSarif({ "readme.txt": "no sarif here" }, (root) => {
    assert.throws(() => readFindings(root), /no local SARIF evidence/u);
    const { code, output } = runGate(root);
    assert.equal(code, 1);
    assert.match(output, /BLOCKED: CodeQL returned no local SARIF/u);
  });
});

test("CB-SEC-CI-001 gates on high severity and reports the summary", async () => {
  await withSarif({
    "run/js.sarif": sarif([rule("js/xss", "8.1"), rule("js/quality", "3.0")],
      [result("js/xss", "src/pages/en.astro", 12), result("js/quality", "src/lib/a.mjs", 4)]),
  }, (root) => {
    const report = readFindings(root);
    assert.equal(report.resultCount, 2);
    assert.equal(report.files, 1);
    // Highest severity sorts first.
    assert.deepEqual(report.findings.map((item) => item.severity), [8.1, 3.0]);
    assert.deepEqual(report.findings[0], { rule: "js/xss", level: "error", severity: 8.1, path: "src/pages/en.astro", line: 12 });
    assert.equal(gate(report, 7).blocking.length, 1);
    assert.equal(gate(report, 9).blocking.length, 0);
  });
});

test("CB-SEC-CI-001 a blocking finding past the print limit still blocks", async () => {
  // The PR #209 review found the original gate sampled results[:30] before
  // deciding, so a high finding beyond the sample escaped. Keep that regression.
  const results = [];
  for (let index = 0; index < 40; index += 1) results.push(result("js/quality", `src/lib/file-${index}.mjs`, index + 1));
  results.push(result("js/critical", "src/lib/hidden.mjs", 4242));
  await withSarif({ "run/big.sarif": sarif([rule("js/quality", "1.0"), rule("js/critical", "9.8")], results) }, (root) => {
    const report = readFindings(root);
    assert.equal(report.resultCount, 41);
    const blocked = gate(report, 7).blocking;
    assert.equal(blocked.length, 1, "the finding at the end of a large run must reach the decision");
    assert.equal(blocked[0].path, "src/lib/hidden.mjs");
    assert.equal(blocked[0].severity, 9.8);
  });
});

test("CB-SEC-CI-001 normalizes absolute and file URIs and trims the repository prefix", async () => {
  await withSarif({
    "run/abs.sarif": sarif([rule("py/subprocess", "7.5")], [
      result("py/subprocess", "file:///home/runner/work/coinblink/coinblink/assets/archive/m01/tool.py"),
      result("py/subprocess", "/home/runner/work/coinblink/coinblink/scripts/security/x.py"),
      result("py/subprocess", "scripts\\security\\windows.py"),
      result("py/subprocess", "scripts/security/../security/dot.py"),
      result("py/subprocess", "/somewhere/else/outside.py"),
    ]),
  }, (root) => {
    const paths = readFindings(root, { repoRoot: "/home/runner/work/coinblink/coinblink" })
      .findings.map((item) => item.path);
    assert.deepEqual(paths.sort(), [
      "assets/archive/m01/tool.py",
      "scripts/security/dot.py",
      "scripts/security/windows.py",
      "scripts/security/x.py",
      "somewhere/else/outside.py",
    ], "a path outside the checkout is reported without inventing a repository location");
  });
});

test("CB-SEC-CI-001 a run without a numeric security-severity never blocks", async () => {
  await withSarif({
    "run/unknown.sarif": sarif([{ id: "js/unknown" }], [result("js/unknown", "src/lib/a.mjs")]),
  }, (root) => {
    const report = readFindings(root);
    assert.equal(report.findings[0].severity, null);
    assert.equal(gate(report, 7).blocking.length, 0, "an unknown severity is reported, not treated as critical");
  });
});

test("CB-SEC-CI-001 the CLI exits non-zero on blocking findings and zero otherwise", async () => {
  await withSarif({ "run/high.sarif": sarif([rule("js/xss", "8.1")], [result("js/xss", "src/lib/a.mjs")]) }, (root) => {
    const blocked = runGate(root);
    assert.equal(blocked.code, 1);
    assert.match(blocked.output, /CODEQL_BLOCKING=1/u);
    assert.match(blocked.output, /BLOCKED: static analysis found untriaged high or critical issues/u);
  });
  await withSarif({ "run/low.sarif": sarif([rule("js/style", "2.0")], [result("js/style", "src/lib/a.mjs")]) }, (root) => {
    const clean = runGate(root);
    assert.equal(clean.code, 0);
    assert.match(clean.output, /CODEQL_BLOCKING=0/u);
  });
});
