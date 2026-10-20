# SonarCloud Issue #147 — public security triage

**Mission:** `CB-SONAR-147-PUBLIC-TRIAGE-001`
**Repository:** `KayzenRoot/coinblink`
**Observed main SHA:** `aae3533973518e1af846c321a9df89d03a0918f5`
**Investigation:** 2026-10-20; SonarCloud issue reads used GET only.
**Result:** `COMPLETE` for metadata collection and source review; no issue or source changes made.

## Method and completeness

Queried SonarCloud `GET /api/issues/search` for `KayzenRoot_coinblink`, branch `main`, `sinceLeakPeriod=true`, with page size 100. All pages returned HTTP 200: 100 + 100 + 62 = 262 records. The reported total was 262; 262 unique issue keys were retrieved, with zero duplicates and no API errors. Filtering open/unresolved records for vulnerability type or a SECURITY impact produced two records: one legacy `CRITICAL` / impact `HIGH`, and one legacy `MAJOR` / impact `MEDIUM`. The sanitized records are in [`issues-sanitized.json`](./issues-sanitized.json).

The optional rule-detail endpoint was also queried with GET for both rule keys; it returned HTTP 400. The issue search messages and exact source locations remain available and are recorded below. No POST, PUT, PATCH, or DELETE request was used.

## Finding 1 — `python:S2245`

- **Issue key:** `AaFR-cy5CJGJn4IVW2S7`
- **Sonar type / status:** `VULNERABILITY` / `OPEN`
- **Legacy severity:** `MAJOR`; **security impact:** `MEDIUM`
- **Location:** [`assets/archive/m01/blender-hero-scene.py:145`](https://github.com/KayzenRoot/coinblink/blob/aae3533973518e1af846c321a9df89d03a0918f5/assets/archive/m01/blender-hero-scene.py#L145)
- **Reported message:** “Make sure that using this pseudorandom number generator is safe here.”

At the observed line, `random.choice((True, False))` selects the orientation of procedural terrain geometry. The file seeds Python's `random` module and also uses it for bounded visual jitter at lines 109 and 134. The inspected call sites generate scene geometry; the reviewed code does not use these values for authentication, secrets, cryptographic operations, or authorization. This contextual observation does not change the Sonar issue status or accept it as a false positive.

**Minimal future correction proposal:** replace the random geometry choices and jitter with deterministic values derived from stable vertex/face indices (for example, parity for the boolean choice and a bounded deterministic index mapping for jitter). Add a regression test that generates the scene data twice and confirms identical geometry and existing bounds; compare a representative render if visual output is an acceptance requirement. Avoid switching to a cryptographic generator for visual scene generation. This may change the generated scene appearance and needs separate implementation authorization.

## Finding 2 — `python:S4790`

- **Issue key:** `AaFR-czUCJGJn4IVW2TB`
- **Sonar type / status:** `VULNERABILITY` / `OPEN`
- **Legacy severity:** `CRITICAL`; **security impact:** `HIGH`
- **Location:** [`assets/archive/m01/derive-hero-cinematic-exports.py:213`](https://github.com/KayzenRoot/coinblink/blob/aae3533973518e1af846c321a9df89d03a0918f5/assets/archive/m01/derive-hero-cinematic-exports.py#L213)
- **Reported message:** “Make sure that hashing data is safe here.”

The call at line 213 computes a SHA-1 Git blob object ID over the bytes of `GoldenHome.astro`, including Git's `blob <length>\0` object header. The repository uses SHA-1 Git object IDs. In the surrounding script, SHA-256 is separately used for content-integrity digests. The inspected SHA-1 result is recorded as `gitBlobSha`, so changing it to SHA-256 in place would silently change the identifier's meaning and break Git blob-ID comparisons. The review did not find this value being used as a signature, password hash, authentication token, or security decision.

**Minimal future correction proposal:** preserve `gitBlobSha` semantics by obtaining the Git object ID with `git hash-object --stdin`, invoked as an argument array with `shell=False` and repository root as the working directory. Keep SHA-256 for integrity digests. Add a test that compares the helper's output with `git hash-object --stdin` for the same exact bytes (including binary-safe input), and a regression assertion that SHA-256 provenance fields remain unchanged. Do not treat a Git object ID as proof of authenticity or collision resistance. This changes implementation and requires separate authorization.

## Quality Gate relationship

The GitHub check run [118552202578](https://github.com/KayzenRoot/coinblink/runs/118552202578) is a failure on the exact observed main SHA. Its summary reports `D Security Rating on New Code` where `A` is required. It does not enumerate contributing issue keys. The two records above are the only open security/vulnerability records returned by this investigation query, but their exact per-issue contribution to the D rating is **UNCONFIRMED**. A passing Sonar result on a different PR/head would not override this main-branch result.

## Disclosure, scope, and next authorization

This repository and its pull requests are public. Once technical details have been published, making the repository private later will not retract copies or prior disclosure. This report contains metadata and concise source-context analysis only; it includes no credentials, private user data, exploit payloads, or attack walkthroughs.

No source files, Sonar issue states, Quality Gate settings, `main`, PR #180, or PR #181 were changed. No merge, deploy, or production operation occurred. The findings remain open. Any code remediation, issue-state transition, or later Quality Gate evaluation requires a separate explicitly scoped authorization; the critical/high finding should receive priority review before implementation work is approved.

**Attribution:** exact gate attribution `UNCONFIRMED`.
**Redactions:** none were needed in the published allowlisted fields; no raw API response was published.
**Checkpoint delta:** none proposed or applied.
