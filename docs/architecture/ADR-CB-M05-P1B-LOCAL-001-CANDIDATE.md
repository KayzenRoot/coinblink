# ADR-CB-M05-P1B-LOCAL-001: Cryptographic WebAuthn + synthetic D1 assurance (candidate)

**Status: PROPOSED / NON-EFFECTIVE / NO PRIVILEGED CODE AUTHORITY.**
**Risk:** HIGH_ASSURANCE. **Owner:** KayzenRoot, sole human administrator/reviewer.
**Base:** `58321c21508bd6089de1c1a77c21f93a4f0b856a`.
**Associated WO:** `CB-M05-P1B-LOCAL-001`; the M05 module remains a single module, not a new module.

## Existing decisions, not new authorizations
Issue #12 R51 selected primary passkey plus a **distinct second recovery authenticator** and Cloudflare D1 **only in a local-synthetic P1-A setting**. Merged #83/#85 proved local D1/nonce/session MODELS, 2/10/100 Owner contention, CAS and rollback, but did NOT prove cryptographic WebAuthn assertions or production authentication. PR #59 merged P0 `MOCK / SECURITY DISABLED`; the general Security/Data proposal `ADR-CB-M05-P1-SECURE-OWNER-CMS-PROPOSAL.md` remains PROPOSED for privileged code. No real credentials or remote D1 were authorized.

## Next necessary gate
Prepare a bounded **LOCAL** cryptographic signature-verification proof under `CB-M05-P1B-LOCAL-001`, only after the complete candidate is reviewed, explicitly Owner-authorized at its exact final SHA, protected-merged, read back on main and refreshed in an implementation Context Lock. GitHub creation of this document alone admits nothing.

Future local-synthetic proof (not now): use generated disposable test keypairs and a vetted, pinned, security-reviewed standards-compatible WebAuthn verifier, rather than unaudited homegrown signature logic. Verify signed assertion and registration structures: `clientDataJSON.type`, exact server-issued challenge and origin, RP ID hash, UP/UV flags, allowed COSE algorithm and public-key/signature match, actual one-time challenge consume in D1 emulator, credential owner binding, revocation, expiry, replay rejection, malicious origin/RP, tampered payload, malformed/oversized CBOR/JSON/COSE, and unsupported algorithms. Signed assertions with sign_count=0 may be valid for synced passkeys; challenge replay prevention cannot depend on counters alone.

Two independent synthetic authenticator identities must be enforced: no email-only reset, no public signup/bootstrap bypass, no recovery with only a stolen single device. Offline operator-led total-device-loss recovery is an explicit future design decision, NOT a built endpoint.

Session design candidate for LOCAL proof: opaque CSPRNG >=256-bit token, only HMAC/digest persisted, idle/absolute expiry, session fixation denial and rotation, per-session/recovery revocation, simulated Origin + Fetch Metadata + CSRF and content-type protection on mutations. No production cookie issued in this phase. Keep existing `/demo/editorial/**` public and unable to mutate persistent data.

## Decisions deferred to subsequent Owner approval
Actual WebAuthn verifier library/version/dependency supply-chain review, production RP ID/origin/domain and external root secrets, live bootstrap protocol, D1 remote account/binding/limits, migration/rollback and key custody, any Worker privileged route or persistent real CMS, P1-C editorial revisions, P1-D workflow/vault, commercial publishing and payment. These cannot be inferred from this candidate.

## Hard boundaries
All fixtures must be synthetic. Test keys generated at runtime, never committed/logged. D1 must be Wrangler `--local` under ignored state with synthetic config, never remote/account API; no root `wrangler.jsonc`, package, Worker/route/middleware or CI modification without a new reviewed owner-controlled delta. High/critical flaws STOP. Preserve prior P1-A evidence rather than relabeling mock results as real crypto.

**STOP:** this ADR does not authorize implementing or merging P1-B, WebAuthn account creation, real passkeys, cloud/provider/network operations, deploy, production publication, brand rights, checkpoint promotion or a module DONE claim. The only proposal is local cryptographic assurance after explicit protected admission.