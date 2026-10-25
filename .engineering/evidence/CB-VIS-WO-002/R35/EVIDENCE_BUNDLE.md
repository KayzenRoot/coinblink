# CB-VIS-WO-002 · R35 Evidence Bundle

**Run:** CB-EXEC-20261014-12H-R35
**Classification:** DEMO_ONLY
**Current evidence state:** local implementation and test suite complete; exact-head hosted CI and technical review are pending.

## Scope

The isolated brand-library change imports only the five owner-approved R32 SVG byte streams into public/brand/**. A scoped `.gitattributes` preserves their bytes across Windows checkouts. Tests and browser harness are under test/brand/**; this bundle is under .engineering/evidence/CB-VIS-WO-002/**.

No application/header integration, global favicon installation, golden-reference modification, merge, deploy, commercial release, checkpoint edit, or ruleset change is authorized or performed.

## Evidence index

- execution-journal.md — execution boundaries and observed operations.
- source-lock.json — exact base, governing-source fingerprints, and transport authorization.
- changes-manifest.json — allowlisted changed paths, per-file byte counts, and SHA-256 values; its own hash is excluded to avoid self-reference. The published exact HEAD is recorded by the PR API and final report.
- tests-and-ci.json — local and hosted validation results; update at exact PR HEAD.
- run-browser-qa.mjs — isolated, allowlisted browser test and screenshot generator.
- security-a11y-qa.md — SVG restrictions and browser accessibility checks.
- visual-proof-index.md — viewport captures and rendered-size coverage.
- screenshots/ — exact desktop, tablet, and mobile viewport captures plus full-page asset matrices, all SHA-256 indexed.
- review-and-blockers.md — technical verdict and rights/governance blockers.
- checkpoint-delta-PROPOSED.md — proposed delta only; canonical checkpoint remains untouched.

## Stop conditions

The brand PR must remain open and unmerged. A successful import is not commercial clearance, merge authority, release authority, or a checkpoint promotion.

## Correction Delta · 2026-10-25 · Scope gate remediation (same PR, demo only)

- **Owner-authorized parent HEAD:** `88f8e7d6bd5474cb9cff417cc30c5533b3f418a8`, on branch `codex/cb-vis-wo-002-phase-a-r35-20261014`. **Protected main at preflight:** `524a93a970af9cf8cfb411f8ba7aa9f57ca79603`; not modified.
- **Observed defect:** [PR Assurance run 39961255821](https://github.com/KayzenRoot/coinblink/actions/runs/39961255821), scope job `120439524549`: FAILED due to exactly two forbidden changed paths, `gef-doctor.log` and `gef-status.log` under this R35 evidence directory.
- **Minimal correction:** remove ONLY those two historical GEF log files from this branch's current tree and from `changes-manifest.json` inventory. Their contents remain recoverable in Git commit `88f8e7d6bd5474cb9cff417cc30c5533b3f418a8`; read-only historical GEF execution is summarized in `execution-journal.md` and `tests-and-ci.json`. Those are historical observations, **not** a current mandatory GEF gate.
- The inventory's `fileCount` is adjusted from 34 to 32 (self-excluded) and the Evidence Bundle hash refreshed. The expected pull-request changed-file count is 33, including the manifest. **All five R32 approved SVG bytes, brand rights manifest, tests, `.gitattributes`, screenshots and Golden reference are unchanged.** No rule, scanner or scope policy was disabled.
- **Final-HEAD verification requirements:** re-read PR HEAD and changed-file inventory; confirm zero forbidden paths, five immutable SVGs and brand/test blobs, Build, SonarCloud, Socket, PR Assurance scope, CI Quality and other applicable checks. Observe their real exact-HEAD conclusions; a pending/skipped/inaccessible check is NOT PASS. Check submitted reviews and threads; prior `CHANGES_REQUESTED` review remains historically valid until the finding is demonstrably corrected.
- **Residual:** stacked brand variant is dark-surface-only; commercial/trademark rights pending. No header/global favicon integration, production, Ready, merge, deploy, spending, other PR edit or canonical checkpoint promotion. This section documents a correction candidate, not a merge approval. See the live Checks tab for final SHA evidence.
