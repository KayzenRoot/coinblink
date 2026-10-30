// M14 D1 backup: export the remote owner database, verify its shape and write a
// manifest with counts and a SHA-256. The dump contains owner data (WebAuthn
// public keys, session digests, private drafts, research notes, aggregate
// views); it stays in the gitignored .backups directory and is never printed.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DATABASE = "coinblink-cms";
export const REQUIRED_TABLES = Object.freeze([
  "cms_audit_events", "cms_bootstrap_challenges", "cms_bootstrap_tickets", "cms_challenges",
  "cms_credentials", "cms_draft_revisions", "cms_drafts", "cms_emergency_authorizations",
  "cms_enroll_challenges", "cms_owner", "cms_pageviews", "cms_recovery_authorizations",
  "cms_research_notes", "cms_sessions", "d1_migrations",
]);
export const COUNTED_TABLES = Object.freeze([
  "cms_owner", "cms_credentials", "cms_drafts", "cms_draft_revisions",
  "cms_pageviews", "cms_research_notes", "cms_audit_events",
]);

const TABLE = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+"?([A-Za-z0-9_]+)"?/giu;
const INSERT = /INSERT\s+INTO\s+"?([A-Za-z0-9_]+)"?/giu;

export function tableNamesFromDump(sql) {
  const names = new Set();
  for (const match of String(sql).matchAll(TABLE)) names.add(match[1]);
  return Object.freeze([...names].sort());
}

function insertedTables(sql) {
  const names = new Set();
  for (const match of String(sql).matchAll(INSERT)) names.add(match[1]);
  return names;
}

/**
 * A backup is usable only when every expected table exists and every non-empty
 * counted table contributed rows. Empty tables are allowed.
 */
export function assertBackupShape(sql, counts) {
  if (typeof sql !== "string" || sql.trim() === "") throw new Error("backup is empty");
  const tables = new Set(tableNamesFromDump(sql));
  const missing = REQUIRED_TABLES.filter((name) => !tables.has(name));
  if (missing.length > 0) throw new Error("backup is missing tables: " + missing.join(", "));
  const inserted = insertedTables(sql);
  const missingData = COUNTED_TABLES.filter((name) => Number(counts?.[name] ?? 0) > 0 && !inserted.has(name));
  if (missingData.length > 0) throw new Error("backup is missing rows for: " + missingData.join(", "));
  return true;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function parseCounts(output) {
  const parsed = JSON.parse(output);
  const row = Array.isArray(parsed) ? parsed[0]?.results?.[0] : undefined;
  if (row === null || typeof row !== "object") throw new Error("unexpected wrangler output");
  const counts = {};
  for (const name of COUNTED_TABLES) {
    const value = Number(row[name]);
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("invalid count for " + name);
    counts[name] = value;
  }
  return Object.freeze(counts);
}

export function compareCounts(expected, actual) {
  const mismatches = COUNTED_TABLES
    .filter((name) => Number(expected?.[name]) !== Number(actual?.[name]))
    .map((name) => ({ table: name, expected: Number(expected?.[name]), actual: Number(actual?.[name]) }));
  return Object.freeze(mismatches);
}

function wranglerBin() {
  return path.join("node_modules", "wrangler", "bin", "wrangler.js");
}

function runWrangler(args, { quiet = false } = {}) {
  return execFileSync(process.execPath, [wranglerBin(), ...args], {
    encoding: "utf8",
    stdio: ["ignore", quiet ? "ignore" : "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });
}

function countQuery() {
  return "SELECT " + COUNTED_TABLES
    .map((name) => "(SELECT COUNT(*) FROM " + name + ") AS " + name)
    .join(",");
}

export function readCounts({ remote, persistTo } = {}) {
  const args = ["d1", "execute", DATABASE, remote ? "--remote" : "--local", "--json", "--command", countQuery()];
  if (!remote && persistTo !== undefined) args.push("--persist-to", persistTo);
  return parseCounts(runWrangler(args));
}

export function backupPaths(now = new Date(), directory = ".backups") {
  const stamp = now.toISOString().replace(/[:.]/gu, "-");
  const sql = path.join(directory, DATABASE + "-" + stamp + ".sql");
  return Object.freeze({ sql, manifest: sql.replace(/\.sql$/u, ".manifest.json") });
}

export function buildManifest({ sql, counts, createdAt = new Date().toISOString() }) {
  return Object.freeze({
    database: DATABASE,
    createdAt,
    bytes: Buffer.byteLength(sql),
    sha256: sha256(sql),
    counts,
    tables: tableNamesFromDump(sql),
  });
}

function main() {
  const paths = backupPaths();
  mkdirSync(path.dirname(paths.sql), { recursive: true });
  const counts = readCounts({ remote: true });
  runWrangler(["d1", "export", DATABASE, "--remote", "--skip-confirmation", "--output", paths.sql], { quiet: true });
  const sql = readFileSync(paths.sql, "utf8");
  assertBackupShape(sql, counts);
  const manifest = buildManifest({ sql, counts });
  writeFileSync(paths.manifest, JSON.stringify(manifest, null, 2) + "\n");
  process.stdout.write("Backup written: " + paths.sql + " (" + statSync(paths.sql).size + " bytes)\n");
  process.stdout.write("Counts: " + JSON.stringify(counts) + "\n");
  process.stdout.write("SHA-256: " + manifest.sha256 + "\n");
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
