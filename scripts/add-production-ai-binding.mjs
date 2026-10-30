// Production-only AI binding.
//
// `wrangler dev` proxies an AI binding to the remote API, which needs a
// Cloudflare token even for local previews and CI. The built Worker config
// therefore stays credential-free; only the deploy config adds the reviewed
// binding, and it is validated before it is written.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { assertWorkerPreviewConfig } from "./worker-preview-config-safety.mjs";

const SOURCE = "dist/server/wrangler.json";
const TARGET = "dist/server/wrangler.deploy.json";

export function withProductionAiBinding(config, { generated = true } = {}) {
  const next = { ...config, ai: { binding: "AI" } };
  assertWorkerPreviewConfig(next, "production deploy config", { generated });
  return next;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = JSON.parse(readFileSync(SOURCE, "utf8"));
  writeFileSync(TARGET, JSON.stringify(withProductionAiBinding(config), null, 2) + "\n");
  process.stdout.write("Production deploy config adds the reviewed AI binding\n");
}
