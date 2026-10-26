// Local-only combined developer experience for CoinBlink M01 reader + M05 synthetic CMS.
// No public privileged route, production credentials, Cloudflare deployment or remote database.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const astro = resolve("node_modules/astro/bin/astro.mjs");
const cms = resolve("test/modules/CB-M05/p1c-local-preview.mjs");
const components = [
  ["Astro CLI", astro],
  ["isolated M05 CMS preview", cms],
];

async function main() {
  const missing = components.filter(([, file]) => !existsSync(file));
  if (missing.length) {
    throw new Error("Local Studio components missing: " + missing.map(([name]) => name).join(", ") + ". Run npm ci first.");
  }
  if (process.argv.includes("--check")) {
    process.stdout.write("CoinBlink LOCAL studio launcher ready: Home + synthetic CMS modules found. No service started.\n");
    return;
  }
  if (process.argv.slice(2).length) throw new Error("Unknown Studio options. Use --check or no arguments.");

  const { startLocalCmsPreview } = await import(pathToFileURL(cms).href);
  const reader = spawn(process.execPath, [astro, "dev", "--host", "127.0.0.1", "--port", "4321", "--strictPort"], {
    cwd: process.cwd(), stdio: "inherit", env: process.env,
  });
  let releaseStop;
  const stopRequested = new Promise(resolveStop => { releaseStop = resolveStop; });
  const handleSignal = () => releaseStop("terminal signal");
  process.once("SIGINT", handleSignal);
  process.once("SIGTERM", handleSignal);
  const readerExit = new Promise(resolveExit => {
    reader.once("exit", (code, signal) => resolveExit("Home process exited (" + (signal || code) + ")"));
    reader.once("error", error => resolveExit("Home failed: " + error.message));
  });
  let preview;
  try {
    preview = await startLocalCmsPreview({ headless: false, admin: true, persistLocal: true });
    process.stdout.write("\nM01 HOME: http://127.0.0.1:4321/en or http://127.0.0.1:4321/pt-br\n");
    process.stdout.write("M05 LOCAL CMS: isolated Chromium window. Sign in with the disposable test passkey.\n");
    process.stdout.write("D1 test drafts: .wrangler/coinblink-m05-drafts-local (never synced/deployed).\n");
    process.stdout.write("Close the CMS browser or press Ctrl+C to stop both local experiences.\n\n");
    const cmsExit = new Promise(resolveExit => preview.browser.once("disconnected", () => resolveExit("CMS browser closed")));
    const reason = await Promise.race([stopRequested, readerExit, cmsExit]);
    process.stdout.write("Stopping CoinBlink local Studio: " + reason + "\n");
  } finally {
    process.off("SIGINT", handleSignal);
    process.off("SIGTERM", handleSignal);
    try {
      if (preview) await preview.close();
    } finally {
      if (reader.exitCode === null) reader.kill("SIGTERM");
    }
  }
}

try {
  await main();
} catch (error) {
  process.stderr.write("LOCAL Studio could not start: " + (error?.message || "unknown error") + "\n");
  process.exitCode = 1;
}
