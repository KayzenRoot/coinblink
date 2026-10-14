# CB-VIS-WO-002 · Phase A Pre-Admission Context Lock

**State:** `OWNER_APPROVED_PHASE_A / PRE_ADMISSION_CANDIDATE / NOT_EXECUTABLE`.
**Main exact base:** `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`. The branch of this proposal is `governance/cb-vis-wo-002-admission-r32-20261014`; PR #75 is **DRAFT**. Owner's current instruction forbids merge, deploy, homepage modifications and commercial publishing.
**Contract:** `.engineering/work-orders/CB-VIS-WO-002.md`, proposal `.engineering/proposals/CB-VIS-WO-002-SCOPE-ADMISSION.md`.
**Owner acceptance:** `.engineering/evidence/CB-VIS-WO-002/OWNER_R32_VECTOR_ACCEPTANCE.md`, `.engineering/evidence/CB-VIS-WO-002/OWNER_PHASE_A_SCOPE_AUTHORIZATION.md`, Issue #74.

## Source main fingerprints (immutable Git **blob** SHAs at `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`)
| Path | Verified source Git blob SHA |
|---|---|
| `AGENTS.md` | `4e8a6ebeb4aa18ac58171fcddf3bde762d725ca7` |
| `.engineering/CHECKPOINT.json` | `eb9a00c4ae1e6b20d781bc6f2b995889b118b6be` |
| `.engineering/SCOPE.md` | `80fa60e1557e2b4a46b10088eb83040662b39f04` |
| `.engineering/DEFINITION-OF-DONE.md` | `8f136953924ef9e5e118f61384fe11d346e5b297` |
| `.engineering/SOURCE-HIERARCHY.md` | `38ede6577b26a1c73ee0ca7b24488e21e14ab4d5` |
| `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md` | `69af2cfaccbd74fce08ef14e2c75f59ccd7053e9` |
| `assets/reference/reference-manifest.json` | `6d4e235b9f328588231329ddc8d5d28b8ae3eabd` |

**Reference image raw SHA256:** original approved AI JPEG `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0`. The Owner-approved new five R32 SVG SHA256 hashes and contact sheet/ZIP are in the separate Owner visual evidence and MUST be reverified from local bytes at future execution.

## Scope fences
- This draft governance PR may change only these approved pre-admission documents: `.engineering/work-orders/CB-VIS-WO-002.md`, `.engineering/context-locks/CB-VIS-WO-002.md`, `.engineering/evidence/CB-VIS-WO-002/OWNER_*_ACCEPTANCE.md` or `OWNER_PHASE_A_SCOPE_AUTHORIZATION.md`, `.engineering/proposals/CB-VIS-WO-002-SCOPE-ADMISSION.md`. No site assets, runtime source, scripts/tests, config or checkpoint.
- Post-effective-admission implementation branch allowlist: `public/brand/**`, `test/brand/**`, `.engineering/evidence/CB-VIS-WO-002/**`; **not all current PR governance paths.**
- Explicit DENY: Golden JPEGs, `src/**`, global favicon or header, other modules (M01/M05), source-authority/checkpoint promotion, workflow/deps, settings, paid tools, deployment and public/commercial release.

## Critical independent gates
1. `OWNER_VECTOR_APPROVAL=ACCEPTED_FOR_DEMO`: **satisfied** for hashes in #74.
2. `OWNER_SCOPE_AUTHORIZATION_PHASE_A=GRANTED`: **satisfied** by Owner's direct statement, recorded #74.
3. `EFFECTIVE_ADMISSION_ON_MAIN`: **not satisfied**; current Owner direction explicitly prohibits merge; the candidate record alone confers no executable permission.
4. `ORIGINAL_ASSET_HASHES`: candidate fingerprints supplied; **must be reconfirmed by future executor** before import.
5. `COMMERCIAL_RIGHTS`: PENDING #72, independent of owner visual approval.
6. `GEF/CI`: candidate CI exact-head should be checked, but GREEN does not replace step 3.
7. `ADMIN_GO_NO_GO`: for future integration/release, not issued. GitHub account `KayzenRoot` single admin, no outside collaborator.

## STOP / freshness
If canonical main or authorized paths change, regenerate Context Lock fingerprints and re-review; do not silently rebase on undocumented authority. For this PR stop **before merge and before Codex R33 asset import**. Later authorization for governed merge/admission must be separate and explicit.
