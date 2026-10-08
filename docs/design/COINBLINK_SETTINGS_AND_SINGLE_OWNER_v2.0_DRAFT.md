# CoinBlink: Single Owner and Complete Settings & API Vault v2.0 (DRAFT)

Status: proposed security/UX spec, no implementation. Owner directive: one sole human administrator, no public admin signup, all normal service integrations manageable from protected Settings, with persistent credentials protected by a real secrets architecture.

## Owner-only activation and login
1. No public /admin/register. Initial owner access is an out-of-band, single-use expiring bootstrap invitation tied to independently verified email, strong password and MFA (passkey/TOTP) on a protected route.
2. Atomically enforce exactly one permanent OWNER identity; simultaneous claims cannot create a second administrator. Onboarding lock closes after verified claim. Recovery cannot be email-input-only; require recovery codes/second-factor and audited secure ceremony.
3. Use password hashing with a modern proven KDF (Argon2id or approved equivalent), HttpOnly Secure SameSite session cookies, rate limits, CSRF defenses where appropriate, idle/absolute session expiry, revocation and step-up reauthentication before payments, token changes and key rotation.
4. API customers under /developers/console are NOT admins. Newsletter readers are not admins. Future team/editor roles remain disallowed until user explicitly authorizes a new role model. Automation jobs have least-privilege service principals without owner powers.
5. Owner email update requires old factor+new email verification. Log change events without sensitive content. Owner account deletion and auth recovery involve separate break-glass governance.

## Full Settings category map
| Path | Controls | Security / feature gates |
| --- | --- | --- |
| /admin/settings | searchable setup catalog, summary, connectivity state, alerts | statuses not assumed tested |
| /admin/settings/site | logo/brand, locale en/pt-BR/es, theme, homepage, SEO/robots/metadata, links | preview against immutable Golden |
| /admin/settings/editorial | sources, taxonomy, evidence/review policy, correction rules, scheduling, content moderation | no fact-free auto publish |
| /admin/settings/integrations | all provider entries, masked key metadata, test/rotate/revoke, quota, budget and permission scope | keys must be write-only and encrypted |
| /admin/settings/ai-media | text/image/video LLM providers, fallback, model, token quota, output quality/caps, optional authenticated local GPU worker | images require licensing/quality/source review |
| /admin/settings/social | X/IG/TikTok OAuth scopes, app audit state, posting mode, official API quota | no silent live posting |
| /admin/settings/markets | news and quote provider keys, license, freshness, rate cap, fallback chain | cannot redistribute without rights |
| /admin/settings/analytics | lawful consent, retention, bot filtering, event capture, region and aggregated metrics | no fingerprinting without legal basis |
| /admin/settings/monetization | Google AdSense publisher ID and status, ads.txt readiness, sponsor offers, paid API/billing provider | provider verified before activation |
| /admin/settings/security | owner login, password, passkeys/TOTP/recovery, sessions, security alerts | single owner with step-up |
| /admin/settings/notifications | email/optional Telegram channels, quiet hours, incident and cost alerts | secure endpoints and credentials |
| /admin/settings/legal | privacy, cookies/CMP, financial disclaimer and ad policy versions | legal review pending |
| /admin/settings/backup | retention, restore verification, cloud protection | owner-only and protected restore |
| /admin/settings/cloud | visible deployment status, preview URLs, binding health, feature flags | never grant web app root Cloudflare credentials |
| /admin/settings/token | DISABLED placeholder for undecided future chain and contract verification | no token, trading or minting now |

## Provider key vault UI
Each provider card presents provider logo/name, capabilities, environment, verified scopes, last tested, budget limits, expiry, and only a masked suffix. User actions: Add Key, Test Connection, Rotate, Revoke, Disable, Change Limits and View Audit History. Add Key is a masked/write-only secret input with owner session step-up. Never place full key in any GET HTML/JSON, localStorage, screenshots, telemetry, crash logs, URL or git. No 'reveal original saved secret' endpoint.

Credential persistence protocol: OWNER over HTTPS -> anti-CSRF server endpoint -> validate provider/account/region with no plaintext logging -> store secret in approved Cloudflare Secrets Store scoped to a Worker service OR use AEAD envelope encryption (fresh per-record DEK, AES-256-GCM or validated equivalent) with key-encryption KEK stored outside app database -> DB stores only vault ref or ciphertext+wrapped DEK, nonce/tag, redacted suffix, version, scope, enabled and test metadata. Backend decrypts only inside authorized server-side provider call. No browser provider API calls with a secret. Owner can update values through Settings, but bootstrap encryption root/Cloudflare IAM permission is externally provisioned; do not put that master key alongside ciphertext in DB.

Cloudflare Secrets Store has account-level edit/bind privileges: a normal website admin UI must NOT be handed root account token just to write secrets. Architecture ADR chooses (A) carefully scoped dedicated secrets-management intermediary, or (B) application-encrypted DB values with external KEK. Cloudflare Workers Secrets/Store support encrypted secrets and scoped bindings, but the service is not proof an app vault has been created.

Test Connection performs narrowly scoped provider health request and shows saved, untested, connected, expired, invalid, quota blocked, awaiting API app approval or unavailable. It never publishes news/social, deploys cloud code, spends uncontrolled paid tokens, sends payments, mints coins or initiates wallet transfers. Every key rotation revokes old cached sessions and invalidates provider workers after actual success. Preview keys and data must be isolated from production.

## Suggested schemas (not approved migrations)
owner_auth(immutable_owner_id, verified_email, password_hash, mfa metadata), owner_sessions(device, expires, revoked), integrations(id, provider_id, environment, scopes, vault_reference_or_encrypted_secret, masked_alias, key_version, tested_at, health, budget), settings_revision(key, public_nonsecret_json, version, changed_by), provider_usage(source, request_count, cost_measured, time), audit_events(owner_or_service, action, target, time, redacted_fields). Never store key plaintext in generic JSON settings.

## Acceptance and attack tests
Race first-run setup requests; only one OWNER succeeds. Logged-out browsers, readers and API customers cannot view admin UI or admin APIs. Password recovery revokes sessions and logs event. DB dump cannot reveal provider keys without out-of-band KEK. Key change uses MFA, audit and encrypted write-only save. Malformed ciphertext, wrong environment/provider associated data and lost vault permissions must fail closed. No production secrets in public PR previews. Secrets are absent from logs, frontend bundle, analytics, exports and traces. Rotation and provider revoke tested with sandbox. Site/Settings changes are versioned and revertible.

## Sources
https://developers.cloudflare.com/secrets-store/integrations/workers/
https://developers.cloudflare.com/secrets-store/access-control/
https://developers.cloudflare.com/workers/configuration/secrets/
https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html