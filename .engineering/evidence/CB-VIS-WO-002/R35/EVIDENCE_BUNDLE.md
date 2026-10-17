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
