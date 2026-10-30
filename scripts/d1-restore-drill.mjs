// M14 D1 restore drill: restore a backup into an isolated LOCAL database,
// compare every counted table and prove the append-only triggers still abort.
// It never touches the remote database.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DATABASE, compareCounts, readCounts, sha256 } from "./d1-backup.mjs";

export const TRIGGER_CHECKS = Object.freeze([
  { table: "cms_draft_revisions", statement: "UPDATE cms_draft_revisions SET title='tampered'", expected: /immutable/iu },
  { table: "cms_research_notes", statement: "DELETE FROM cms_research_notes", expected: /append-only/iu },
]);

export function latestBackup(directory = ".backups") {
  const files = readdirSync(directory).filter((name) => /^coinblink-cms-.*\.sql$/u.test(name)).sort();
  return files.length === 0 ? null : path.join(directory, files.at(-1));
}

export function verifyManifest({ sql, manifest }) {
  const expected = manifest.sha256;
  const actual = sha256(sql);
  if (expected !== actual) throw new Error("backup hash does not match its manifest");
  return true;
}

function wrangler(args) {
  return execFileSync(process.execPath, [path.join("node_modules", "wrangler", "bin", "wrangler.js"), ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });
}

/** Returns the trigger results; a trigger that allows the write is a failure. */
export function runTriggerChecks(persistTo) {
  const results = [];
  for (const check of TRIGGER_CHECKS) {
    let blocked = false;
    try {
      wrangler(["d1", "execute", DATABASE, "--local", "--persist-to", persistTo, "--command", check.statement]);
    } catch (error) {
      const text = String(error?.stderr ?? "") + String(error?.stdout ?? "");
      blocked = check.expected.test(text);
    }
    results.push({ table: check.table, blocked });
  }
  return Object.freeze(results);
}

function main() {
  const dump = latestBackup();
  if (dump === null) throw new Error("no backup found in .backups");
  const manifestPath = dump.replace(/\.sql$/u, ".manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const sql = readFileSync(dump, "utf8");
  verifyManifest({ sql, manifest });
  const persistTo = path.resolve(".wrangler", "d1-drill", path.basename(dump, ".sql"));
  rmSync(persistTo, { recursive: true, force: true });
  mkdirSync(persistTo, { recursive: true });
  try {
    wrangler(["d1", "execute", DATABASE, "--local", "--file", path.resolve(dump), "--persist-to", persistTo, "--yes"]);
    const actual = readCounts({ remote: false, persistTo });
    const mismatches = compareCounts(manifest.counts, actual);
    const triggers = runTriggerChecks(persistTo);
    const ok = mismatches.length === 0 && triggers.every((entry) => entry.blocked);
    const report = {
      ok, checkedAt: new Date().toISOString(), dump, dumpSha256: manifest.sha256,
      expected: manifest.counts, actual, mismatches, triggers,
    };
    writeFileSync(dump.replace(/\.sql$/u, ".drill.json"), JSON.stringify(report, null, 2) + "\n");
    process.stdout.write("Restore drill " + (ok ? "PASSED" : "FAILED") + " for " + dump + "\n");
    process.stdout.write("Counts: " + JSON.stringify(actual) + "\n");
    if (mismatches.length > 0) process.stdout.write("Mismatches: " + JSON.stringify(mismatches) + "\n");
    for (const entry of triggers) process.stdout.write("Trigger " + entry.table + ": " + (entry.blocked ? "blocked" : "ALLOWED") + "\n");
    if (!ok) process.exitCode = 1;
  } finally {
    rmSync(persistTo, { recursive: true, force: true });
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
