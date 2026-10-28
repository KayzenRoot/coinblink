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

## Dependency review is enabled again

`actions/dependency-review-action` fails a pull request that adds a high-severity vulnerable dependency. It needs the repository's dependency graph, which is why it was removed once with *"Dependency review is not supported on this repository"*. Dependabot alerts and automated security fixes are now enabled, and the job is back in the workflow.

## What is still not a blocking gate, and why

`npm audit --audit-level=high` reports five remaining advisories, all inside the build-time Cloudflare toolchain (`wrangler`, `miniflare`, `undici`, `@astrojs/cloudflare`, `@cloudflare/vite-plugin`). They are not shipped in the built Worker, and the only fix npm offers is a semver-major downgrade of `@astrojs/cloudflare` from 15.x to 12.6.13, which is not worth taking for a build-tool advisory. Making it a blocking gate would therefore turn every pull request red without reducing real exposure. The two fixable advisories, `zod` and `fast-uri`, were already patched.

## The weekly baseline is authorized by a narrowed rule

The workflow runs on pull requests, on pushes to `main`, and on a weekly schedule. A weekly run re-checks the existing code when CodeQL publishes new queries.

The repository's own scope guard used to treat any scheduled workflow as elevated and blocked it. That rule is now narrowed instead of removed: a scheduled workflow is accepted **only while it declares no write-capable permission and references no secret**, and it stays blocked otherwise, as does anything using `pull_request_target`, `workflow_run` or `deployment_status`. The guard's tests encode all three cases, so a scheduled workflow that can write or that reads a credential is still refused.

