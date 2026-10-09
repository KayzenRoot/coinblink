import assert from "node:assert/strict";
import { test } from "node:test";
import { validatePreviewOutput } from "../scripts/record-preview-output.mjs";
import { CLOUDFLARE_PREVIEW_WORKER_NAME } from "../scripts/cloudflare-preview-policy.mjs";

const validOutput = {
  type: "preview",
  version: 1,
  worker_name: CLOUDFLARE_PREVIEW_WORKER_NAME,
  preview_id: "preview-id",
  preview_name: "coinblink-m00-run-123-1",
  preview_slug: "preview-slug",
  preview_urls: ["https://preview-slug.account.workers.dev"],
  deployment_id: "deployment-id",
  deployment_urls: ["https://immutable-preview.account.workers.dev"],
};

test("accepts actual-shaped Wrangler stable and immutable Preview URLs", () => {
  assert.deepEqual(validatePreviewOutput(validOutput, validOutput.preview_name), {
    previewUrl: "https://preview-slug.account.workers.dev",
    deploymentUrl: "https://immutable-preview.account.workers.dev",
  });
});

test("rejects wrong Worker, fabricated Preview name, duplicate, and unsafe URLs", () => {
  assert.throws(() => validatePreviewOutput({ ...validOutput, worker_name: "coinblink-production" }, validOutput.preview_name), /other than the dedicated/);
  assert.throws(() => validatePreviewOutput(validOutput, "coinblink-m00-run-999-9"), /does not match/);
  assert.throws(() => validatePreviewOutput({ ...validOutput, deployment_urls: validOutput.preview_urls }, validOutput.preview_name), /must be distinct/);
  assert.throws(() => validatePreviewOutput({ ...validOutput, preview_urls: ["http://example.com"] }, validOutput.preview_name), /HTTPS workers.dev/);
  assert.throws(() => validatePreviewOutput({ ...validOutput, deployment_urls: ["https://example.workers.dev/path"] }, validOutput.preview_name), /HTTPS workers.dev/);
  assert.throws(() => validatePreviewOutput({ ...validOutput, deployment_urls: ["https://user:pass@example.workers.dev"] }, validOutput.preview_name), /HTTPS workers.dev/);
});
