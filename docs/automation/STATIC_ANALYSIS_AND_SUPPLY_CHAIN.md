# CoinBlink · Static analysis and supply-chain checks (free tier only)

## What runs, and why

| Check | Workflow | What it proves | Cost |
|---|---|---|---|
| CodeQL (JavaScript/TypeScript and Python) | `.github/workflows/security-analysis.yml` | Untriaged high or critical static-analysis findings never reach `main` unnoticed | Free for public repositories |
| Findings gate contracts | same workflow, `contracts` job | The gate itself is tested before it is trusted on real analysis | Free (no install, Node built-ins only) |
| Gitleaks | `.github/workflows/ci-quality.yml` | No hardcoded secret in the commit history | Free, no license key on a personal public repo |
| SonarCloud | analysis of each pull request | Quality gate on new code | Free for public repositories |
| Socket | project and pull-request reports | Dependency risk and supply-chain signals | Free tier |

Nothing in these workflows requires a paid plan, a vendor token, a self-hosted runner or a stored secret.

## Two free checks that are not wired up, and why

Both were attempted and removed after the repository refused them, rather than left as permanently red statuses:

- **Dependency review** (`actions/dependency-review-action`) fails closed with *"Dependency review is not supported on this repository. Please ensure that Dependency graph is enabled."* The Dependency graph is a free repository setting, currently off. Enabling it in Settings → Security analysis is a one-click owner action; the job can be added back afterwards.
- **`npm audit --audit-level=high`** as a blocking gate is not viable today: it reports two high-severity advisories in `zod@4.6.5`, a transitive dependency of `astro@7.3.8` (`zod: ^4.6.5`). `npm audit fix` does not resolve them and `--force` would install incompatible versions, so the gate would be red on every pull request until upstream allows a safe bump. Tracked separately instead of blocking work.

## No scheduled trigger

The workflow runs on pull requests and on pushes to `main` only. A weekly schedule was written first and removed because this repository's own scope guard classifies scheduled or deployment triggers as elevated: *"Elevated workflow blocked: … scheduled/deployment workflow trigger requires separate authorization"*. Re-adding a cron baseline is an owner decision, not a CI detail.

## Why CodeQL runs without upload

The checkout is a public demonstration repository, so `upload: never` is deliberate:

- Findings stay in the log of the run instead of being published in the code-scanning tab.
- No `security-events: write` permission is requested, so the workflow keeps `contents: read`.
- There is no dependency on a baseline comparison, so an untriaged finding from pre-existing code cannot flip every pull request red on the first run.

The job fails only when a result carries `security-severity` at or above `7.0`, that is, high or critical. Quality-only findings are printed in a bounded summary and do not block. `--fail-at=<severity>` changes the threshold if the owner decides otherwise.

## The gate always reads every result

`scripts/security/codeql-findings-gate.mjs` builds its decision from **every** result of every run and every SARIF document. Only the printed summary is capped at 20 findings. This is the correction for the defect found during the pull-request #209 review, where the decision was taken from `results[:30]` and a high finding past index 30 could not block the job. `test/security/codeql-findings-gate.test.mjs` keeps that regression: a 41-result run with the only high finding last must still block.

Paths are normalized before printing: `file://` URIs, absolute runner paths, `./`, `..` and Windows separators are all reduced to a repository-relative path, and a path outside the checkout is reported as-is rather than being rewritten to look local.

## What was taken from pull-request #209 and what was left out

Extracted, generalized to the whole repository:

- The idea of running CodeQL for both languages on this checkout with `security-and-quality` and `build-mode: none`, which needs no build and no dependency install.
- The lesson from its review: a gate must decide from the complete result set, never from a sample.

Deliberately **not** integrated:

- The third-party ECC agent skills and the benchmark harness. Its own evidence records the four Codex pilots and the eighteen A/B rows as `NOT_RUN`, and the review classified the marketplace/cache/hook/MCP chain as an unvalidated supply-chain risk. Neither is a quality, security or speed improvement for the product, and `.agents/skills` would install third-party agent instructions into the repository.
- The native ECC installation, hook and MCP enablement, which remain blocked.

## Local reproduction

```powershell
node --test test/security/*.test.mjs
node scripts/security/codeql-findings-gate.mjs <sarif-directory> [--fail-at=7]
```

The gate exits `1` when evidence is missing or when a blocking finding exists, `0` when the analysis is clean or only reports findings below the threshold, and `2` on a usage error.
