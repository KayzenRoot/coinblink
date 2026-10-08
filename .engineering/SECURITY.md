# CoinBlink · Security Baseline (M00 stage)

**Status: OWNER_APPROVED_M00_ONLY / GEF_ADMISSION_PENDING.** Future security for real CMS, paid API and token custody is out of scope until separately admitted.

- M00 has no authenticated owner, real analytics, raw publisher API credentials, account sessions, payments or wallet functionality.
- Cloudflare Worker Previews are **public by default**. No secret content or real credentials in preview; future private admin requires Cloudflare Access or equivalent and M05 owner authentication. Use benign demo content only.
- Explicit nonprod environments; no production resource fallbacks. Do not attach KV, D1, Queues, R2 or services until verified separate credentials/bindings. Astro automatic session KV auto-binding must be disabled and tested.
- CI deploy token (if approved) with least privilege in GitHub Secret settings and only trusted origin. Fork PR runs never access deployment secrets. No `pull_request_target` unsafe untrusted checkout.
- Disable unexpected log/telemetry of API secrets. No production data mixed into Playwright test screenshots. Protect package provenance validation, GEF guardrails, pin package versions.
- Trusted HTTPS/TLS for provider requests whenever added to future modules, no forwarding credentials on cross-origin redirect.
- No forced cloud setup/purchase without owner authorization. If necessary connection is absent, record `PROVIDER_SETUP_REQUIRED` only on remote deploy step.
- Security review must validate code build/test routes; no false claims about security verification from documentation alone.

**One Owner** is the approved V1 administrative direction, but M05 owns implementation/recovery/MFA. No public user can become admin through M00.
