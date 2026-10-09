import { appendFileSync } from "node:fs";
import { derivePreviewName, isManagedPreviewName } from "./cloudflare-preview-policy.mjs";

let previewName;
if (process.env.INPUT_ACTION === "deploy") {
  previewName = derivePreviewName(process.env.GITHUB_RUN_ID, process.env.GITHUB_RUN_ATTEMPT);
} else if (process.env.INPUT_ACTION === "delete" && isManagedPreviewName(process.env.INPUT_PREVIEW_NAME)) {
  previewName = process.env.INPUT_PREVIEW_NAME;
} else {
  console.error("Preview name rejected; only run-derived or managed CoinBlink M00 names are accepted.");
  process.exit(1);
}

if (!process.env.GITHUB_OUTPUT) {
  console.error("GITHUB_OUTPUT is required.");
  process.exit(2);
}

appendFileSync(process.env.GITHUB_OUTPUT, `preview_name=${previewName}\n`, "utf8");
console.log(`Selected managed Preview name ${previewName}.`);
