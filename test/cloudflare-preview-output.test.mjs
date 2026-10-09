import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePreviewOutput } from "../scripts/record-preview-output.mjs";
import { CLOUDFLARE_PREVIEW_WORKER_NAME } from "../scripts/cloudflare-preview-policy.mjs";

const previewName = "coinblink-m00-run-123-1";
const validOutput = {
  preview: {
    id: "preview-id",
    name: previewName,
    slug: "preview-slug",
    urls: [`https://${previewName}-${CLOUDFLARE_PREVIEW_WORKER_NAME}.account.workers.dev`],
  },
  deployment: {
    id: "deployment-id",
    preview_id: "preview-id",
    preview_name: previewName,
    urls: [`https://deployment-id-${CLOUDFLARE_PREVIEW_WORKER_NAME}.account.workers.dev`],
  },
};

function parseMockCliOutput(output, expected = previewName) {
  return parsePreviewOutput(JSON.stringify(output, null, 2), expected);
}

test("accepts Wrangler 4.149.0 CLI JSON with nested Preview and deployment resources", () => {
  assert.deepEqual(parseMockCliOutput(validOutput), {
    previewUrl: `https://${previewName}-${CLOUDFLARE_PREVIEW_WORKER_NAME}.account.workers.dev`,
    deploymentUrl: `https://deployment-id-${CLOUDFLARE_PREVIEW_WORKER_NAME}.account.workers.dev`,
  });
});

test("rejects output targeting a different Worker or Preview name", () => {
  const otherWorker = "coinblink-production";
  assert.throws(
    () => parseMockCliOutput({
      ...validOutput,
      preview: { ...validOutput.preview, urls: [`https://${previewName}-${otherWorker}.account.workers.dev`] },
    }),
    /dedicated CoinBlink M00 Preview Worker/,
  );
  assert.throws(
    () => parseMockCliOutput({
      ...validOutput,
      deployment: { ...validOutput.deployment, urls: [`https://deployment-id-${otherWorker}.account.workers.dev`] },
    }),
    /dedicated CoinBlink M00 Preview Worker/,
  );
  assert.throws(() => parseMockCliOutput(validOutput, "coinblink-m00-run-999-9"), /Preview name/);
  assert.throws(
    () => parseMockCliOutput({
      ...validOutput,
      preview: { ...validOutput.preview, urls: [`https://coinblink-m00-run-999-9-${CLOUDFLARE_PREVIEW_WORKER_NAME}.account.workers.dev`] },
    }),
    /hostname does not match the returned/,
  );
  assert.throws(
    () => parseMockCliOutput({
      ...validOutput,
      deployment: { ...validOutput.deployment, preview_name: "coinblink-m00-run-999-9" },
    }),
    /Preview name/,
  );
  assert.throws(
    () => parseMockCliOutput({
      ...validOutput,
      deployment: { ...validOutput.deployment, preview_id: "another-preview-id" },
    }),
    /does not belong to the returned Preview/,
  );
});

test("rejects duplicate, unsafe, or identity-mismatched Preview URLs", () => {
  assert.throws(() => parseMockCliOutput({
    ...validOutput,
    deployment: { ...validOutput.deployment, id: previewName, urls: validOutput.preview.urls },
  }), /must be distinct/);
  assert.throws(() => parseMockCliOutput({
    ...validOutput,
    preview: { ...validOutput.preview, urls: ["http://example.com"] },
  }), /HTTPS workers.dev/);
  assert.throws(() => parseMockCliOutput({
    ...validOutput,
    deployment: { ...validOutput.deployment, urls: ["https://example.workers.dev/path"] },
  }), /HTTPS workers.dev/);
  assert.throws(() => parseMockCliOutput({
    ...validOutput,
    deployment: { ...validOutput.deployment, urls: ["https://user:pass@example.workers.dev"] },
  }), /HTTPS workers.dev/);
  assert.throws(() => parseMockCliOutput({
    ...validOutput,
    deployment: { ...validOutput.deployment, urls: [`https://another-deployment-id-${CLOUDFLARE_PREVIEW_WORKER_NAME}.account.workers.dev`] },
  }), /hostname does not match the returned/);
});

test("rejects the unrelated flattened output-file event format", () => {
  assert.throws(() => parseMockCliOutput({
    type: "preview",
    version: 1,
    worker_name: CLOUDFLARE_PREVIEW_WORKER_NAME,
    preview_name: previewName,
    preview_urls: validOutput.preview.urls,
    deployment_urls: validOutput.deployment.urls,
  }), /nested Preview and deployment resources/);
});

test("accepts the Wrangler CLI progress line before its nested Preview JSON", () => {
  const cliOutput = `Attaching preview ${previewName} to ${CLOUDFLARE_PREVIEW_WORKER_NAME}\n${JSON.stringify(validOutput, null, 2)}\n`;
  assert.deepEqual(parsePreviewOutput(cliOutput, previewName), {
    previewUrl: `https://${previewName}-${CLOUDFLARE_PREVIEW_WORKER_NAME}.account.workers.dev`,
    deploymentUrl: `https://deployment-id-${CLOUDFLARE_PREVIEW_WORKER_NAME}.account.workers.dev`,
  });
});

test("rejects unrecognized text around Wrangler Preview JSON", () => {
  const json = JSON.stringify(validOutput);
  assert.throws(() => parsePreviewOutput(`Debug output\n${json}`, previewName));
  assert.throws(() => parsePreviewOutput(`Attaching preview\n${json}\nFinished`, previewName));
});
