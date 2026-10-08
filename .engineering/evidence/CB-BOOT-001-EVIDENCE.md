# Evidence Bundle · CB-BOOT-001

**State:** execution evidence prepared for owner exact-head audit; no merge, product promotion or portal implementation.

**Repository / PR:** `KayzenRoot/coinblink` / [PR #2](https://github.com/KayzenRoot/coinblink/pull/2)

**Execution branch:** `chore/cb-boot-001-gef-112`

**Base:** `main` at `6efd4d9c8fd8f23e59ae572bd0dddc1c7c959bac`

**Starting PR head:** `bf80a86d4b1bb0e6efb5d397a83892f610c495cd`

**GEF source:** tag `v1.1.2`, commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82`

## Scope delivered

- Pinned the local GEF CLI dependency at `@gef-bootstrap/cli@1.1.2`, Node.js `22.17.0`, npm `10.9.2`, with a committed npm lockfile.
- Added CLI, integrity, provenance, negative-governance and isolated-apply tests.
- Added a Linux/Windows GitHub Actions matrix with immutable action references and read-only repository permissions.
- Installed three audited Matt Pocock skills as repository-local Codex skills. Source commit, per-file SHA-256 values, review notes and exclusions are in [`CB-BOOT-001-matt-skills.json`](CB-BOOT-001-matt-skills.json).
- Corrected the stale environment-missing checkpoint observation, recorded current source fingerprints, and pinned all GEF policy links to the admitted source commit.
- No product code, design reference, Source Pack, editorial content or deployment was added.

## GEF package identity and provenance

| Evidence | Observed result |
| --- | --- |
| Package | `@gef-bootstrap/cli@1.1.2` |
| Registry SRI | `sha512-zLu0oaBWqwIPviZgN0PTk1/5QlsHK8r7aCNOkMop0MnlzqFZ1um3zfkRO2l8hx005nd/2xZ/Ll/lDzYUbH01uw==` |
| Registry tarball SHA-256 | `331a5d035188ef1dc1c92e5c4e5317edcdbf45956dc07703231bbc64dbb7ab97` |
| SLSA subject digest | Matches the lockfile SRI and fetched registry tarball |
| Provenance source | `KayzenRoot/gef-bootstrap`, tag `v1.1.2`, commit `af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82` |
| Publisher workflow | `.github/workflows/v11-publish.yml`, ref `refs/tags/v1.1.2` |
| Sigstore verification | npm publish and SLSA bundles verified using `sigstore@4.1.1`; bundles and the matching public npm key are retained beside this file |

The package tarball, lockfile digest and attested SLSA subject were checked against one another. `npm ci` completed using the committed lockfile. `npm audit signatures` itself returned `E404` because npm attempted to fetch GEF's private, bundled `@gef-bootstrap/*@0.0.0` runtime packages from the public registry. The signed npm publish and SLSA attestations were therefore verified directly with the Sigstore verifier and the npm registry key; the failed npm subcommand is retained as a limitation, not reported as a pass.

Corrections during validation: the first doctor assertion looked for `GOVERNANCE_SOURCE_ABSENT` at the envelope's top level; the observed CLI schema places it under `doctor.governance.observationLimits`, and the test now checks that exact field. Direct Node `fetch()` could not use this environment's registry proxy, so the provenance test retrieves the same pinned tarball through `npm pack` and hashes its bytes. Both corrected checks pass.

The first Windows CI run exposed two additional issues, both corrected before requesting owner review. Windows checkout converted a pinned skill YAML file to CRLF, so its byte fingerprint differed from the source manifest; `.gitattributes` now forces LF for `.agents/skills/**`. Also, the first `npm audit` found GHSA-52v5-jr5w-gjxr in the test-only `sigstore@4.1.0` verifier; the pin and lockfile now use `4.1.1`, and the repeat audit reports zero vulnerabilities. The initial Windows failure is retained in [workflow run 37800110770](https://github.com/KayzenRoot/coinblink/actions/runs/37800110770). The corrected Ubuntu and Windows checks passed on `42cb42f725e7953a426e215f8869f333d1f824f8` ([Ubuntu](https://github.com/KayzenRoot/coinblink/actions/runs/37800481108/job/113391018977), [Windows](https://github.com/KayzenRoot/coinblink/actions/runs/37800481108/job/113391018255)). The live PR #2 checks page remains authoritative for any later head.

## Local validation

Runtime: Linux x64, Node.js `22.17.0`, npm `10.9.2`.

| Command / check | Result |
| --- | --- |
| `npm ci` | PASS |
| `npm test` | PASS, 5 tests / 0 failures |
| `npm audit --json` | PASS, 0 vulnerabilities after upgrading the test verifier to `sigstore@4.1.1` |
| `gef --help` | PASS, JSON command index emitted |
| `gef --version` | PASS, version `1.1.2`, Node `22.17.0` |
| `gef init --target . --json` | PASS, read-only plan; no apply effect |
| `gef doctor --target . --json` | PASS, read-only; reports missing `.engineering/CHECKPOINT.json` and dependency provenance as unverified/review |
| `gef status --target . --json` | PASS, read-only; progress remains `null`, governance invalid/absent, conservative stale state retained |
| Disposable-target `gef init --apply` | PASS, terminal `SUCCEEDED`, transaction `APPLIED`; repeated apply failed closed without overwriting the initial state |
| Skill discovery / fingerprints | PASS, all three `.agents/skills/<name>/SKILL.md` entries and per-file hashes verified |

The absent checkpoint JSON is an intentional known gap because product planning is still open. It was not generated or promoted to fabricate a healthy product state. GEF's read-only commands preserved that distinction.

## Exact clean-checkout validation

Commit `42cb42f725e7953a426e215f8869f333d1f824f8` was checked out into a new regular clone on Linux x64, installed with Node.js `22.17.0` / npm `10.9.2`, and verified clean before execution. `npm ci`, all five tests, and `npm audit --json` passed (zero vulnerabilities). The five documented GEF commands (`--help`, `--version`, init preview, doctor and status) all exited 0. Before apply, init preview reported `effect=NONE`, repository `CLEAN`, install `READY`, canonical `READY`; doctor/status truthfully reported `.engineering/CHECKPOINT.json` absent/invalid, dependency provenance `REVIEW`, progress `null`, and conservative `stale=true` because no drift baseline existed.

On this exact clean checkout, `gef init --apply --target . --json` returned terminal `SUCCEEDED`, effect `CONFIRMED`, transaction `APPLIED`, and artifact `.gef/init-state.json`. Its SHA-256 was `a67da027a48cd6b03ed707cd493f97e993f0224afd8b7231be02f48843c0d66b`; the local receipt SHA-256 was `50df07b15b9632b1e65aef03bae347ee38015cd401bd78ad2ac191c6be5b30de`. Post-apply doctor/status remained read-only; checkpoint/release stayed absent/invalid and progress stayed `null`, while status recorded the new drift baseline and `stale=false`. These runtime artifacts stayed in the disposable clone and were not committed.

One GEF v1.1.2 behavior is surfaced for owner audit: its pre-apply `init` plan (and the plan embedded in the successful apply result) reported `drift.changed=true`, `class=UNEXPECTED` despite `driftBaseline` being absent and the repository being clean. The pinned CLI README says an ungoverned target has no comparison and must not manufacture `UNEXPECTED` drift ([README at admitted commit](https://github.com/KayzenRoot/gef-bootstrap/blob/af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82/packages/cli/README.md#L197-L206)); source inspection shows `compareProjectDrift` feeds the `NO_RECORDED_STATE` sentinel into `detectDrift` ([registry.ts at admitted commit](https://github.com/KayzenRoot/gef-bootstrap/blob/af1fe9371a3883cbd8a4aafcbb405ddcd4c2ca82/packages/cli/src/registry.ts#L1410-L1418)). The apply still completed without changing tracked project files, and post-apply status correctly recorded a baseline, but this false-positive drift classification is a non-blocking GEF release inconsistency for owner review before any future GEF adoption or upgrade.

## CI, evidence and review gate

`.github/workflows/gef-validation.yml` runs the same `npm ci` and `npm test` commands on Ubuntu 24.04 and Windows 2022 with Node.js `22.17.0`. Ubuntu passed on initial head `4279ed0fac737149052ee20957bf2c372757a269`; Windows first failed on the fingerprint mismatch described above. Both jobs passed after the correction on `42cb42f725e7953a426e215f8869f333d1f824f8`. Later commits trigger the same matrix; review the checks attached to the current PR head before approval.

## Third-party licensing review (owner audit correction)

The selected Matt Pocock skills are MIT licensed. This repository now preserves the complete original copyright and permission notice at `.agents/skills/LICENSE` alongside the copied skills, pointing to the pinned Matt Pocock source revision. The MIT notice applies to that third-party material only and does not grant a license over other CoinBlink materials.

## Proposed checkpoint delta

Keep the project in `IN PROGRESS / CB-BOOT-001 OWNER AUDIT PENDING`. Record GEF and the three pinned skills as installed, retain the missing product checkpoint/Source Pack and open planning status, and promote nothing until owner exact-head audit. This is a proposal only.

**Next legal action:** after the current PR head's Linux and Windows checks pass, request the owner's exact-head audit. Do not merge or begin portal implementation.
