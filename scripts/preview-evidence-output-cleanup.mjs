import { rm } from "node:fs/promises";
import { join } from "node:path";

const staleArtifacts = [
  "desktop-1536x864.png",
  "tablet-768x1024.png",
  "mobile-390x844.png",
  "RESULTS.json",
  "PLAYWRIGHT-LOG.md",
  "SHA256SUMS.txt",
  "FAILED.json",
];

export async function clearStalePreviewEvidenceArtifacts(outputDirectory) {
  await Promise.all(staleArtifacts.map((fileName) => rm(join(outputDirectory, fileName), { force: true })));
}
