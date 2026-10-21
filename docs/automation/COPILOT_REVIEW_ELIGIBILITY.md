# CoinBlink · GitHub Copilot automatic code-review readiness (NO COST / NO ACTIVATION)

Status: **proposal in a separate PR only**. The policy in `docs/automation/copilot-ruleset.disabled.json` is inert documentation and is **not installed** on GitHub. The optional Copilot instructions do not enable reviews or incur Copilot requests.

## Observed state (2026-10-19, GitHub connector)

- Repository `KayzenRoot/coinblink` is PUBLIC, owned by a GitHub **User**, not an Organization. It has **0 stars** at audit time.
- `main` was protected at `0e981a9fb89d25c763f228b3e3bdb3a5a58d64ad`, with required checks **Build (Ubuntu)**, **SonarCloud Code Analysis**, **Socket Security: Pull Request Alerts**.
- `GET /repos/KayzenRoot/coinblink/rulesets?includes_parents=true` returned an empty list. **No repository/parent ruleset was visible to this connector.** Existing protection is a separate mechanism and must not be changed.
- `GET /repos/KayzenRoot/coinblink/branches/main/protection` and `.../required_pull_request_reviews` returned **403 Resource not accessible by integration**. Number of required human reviews, bypass rules and dismissal behavior could not be confirmed.
- Queries for Copilot user entitlement, subscription, AI-credit balance, billing policy or repository Code Review configuration were **not supported by the available connector**. **Do not assert a license is present or that a review will be free.**
- PR #174 introduced repo-level CodeRabbit auto-review YAML. CodeRabbit explicitly reported it recognized `Repository YAML (base)` but **did not start automatic reviews because the repository had fewer than 10 stars**. That is a provider eligibility block, not missing GitHub configuration. Never purchase a plan or farm stars to bypass it.

## Official Copilot options

GitHub supports a branch ruleset rule with `type: copilot_code_review` and boolean `review_draft_pull_requests` and `review_on_push` parameters. The accompanying example is **disabled**, targets only the default branch and initially sets both options to **false** to prevent repeat-credit use. It does not modify the existing branch-protection/approval rules. GitHub also supports user-level automatic review configuration independent of rulesets, for eligible paid user plans.

The account's ChatGPT subscription is unrelated to GitHub Copilot code-review entitlement. GitHub Copilot Free/no-license accounts have **no included Code Review AI-credit allowance**. For organizations, allowing members without a Copilot license may require explicitly enabling paid AI credits, which violates the owner's zero-spend constraint here. Being a PUBLIC repository or GitHub admin is not proof of Copilot eligibility.

Sources (official):
- https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/configure-code-review
- https://docs.github.com/en/copilot/concepts/agent-capabilities/agent-powered-workflows-and-operations/code-review
- https://docs.github.com/en/rest/repos/rules

## Zero-cost activation gate: DO NOT ACTIVATE YET

1. **Read** and verify Copilot Code Review entitlement for the exact GitHub identity authoring future PRs; determine who would be charged for automatic reviews and new pushes. Require documented evidence that the chosen allowance is included and that extra paid credits cannot be used. An admin role is not evidence of a Copilot plan.
2. Confirm admin availability and policies in the personal repository's Settings > Copilot > Code review and Settings > Rules > Rulesets. The connector currently cannot verify entitlements and cannot create/update rulesets.
3. Confirm the approved policy is compatible with present legacy main protection; do **not** replace or disable existing Build, SonarCloud, Socket and required review gates or allow bypass actors.
4. Only after separate authorization and verified no-cost entitlement, propose installing the disabled template first, verify the server returned the intended fields, and request a **new specific authorization** before activating. Automatic Code Review and AI approval-for-merge must remain distinct; do not enable auto-approval/count AI approvals toward merge.
5. Initial safe review policy if allowed later: target default branch, skip draft PRs, **do not** re-review every push until the quota effect is known. If free quota is exhausted, stop reviewing; never enable additional paid consumption, pay-as-you-go or organization billing to continue.
6. Before claiming success, independently observe an actual Copilot review on a new eligible PR and validate the correct HEAD, reviewer identity, review substance, run provenance and cost. No synthetic APPROVED, no use of `kayzenweb3` as an independent human from `KayzenRoot`.

## Available automation without Copilot

Keep using existing GitHub Build, Socket, SonarCloud, bounded PR assurance and the opt-in CoinBlink PR Radar. Those tools provide **technical evidence**, not a human reviewer; self-modifiable workflows must not be treated as independent security reviewers. Confirm external audit and independent-person requirements before requesting a specific owner-authorized squash merge.

## STOP / safety

No actual ruleset was created or enabled. No Copilot review requested, no GitHub AI credits consumed deliberately, no billing settings changed, no new privileged workflows, no secret tokens, no PR #172/#173/#174 modifications, no merge, deploy, publication, LIVE, remote D1, GEF, release or checkpoint.
