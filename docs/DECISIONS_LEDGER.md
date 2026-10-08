# CoinBlink · Decisions Ledger (working, 2026-10-08)

This register **preserves the exact distinction between owner-approved direction, candidate approaches, and unapproved planning**. It does not substitute GEF governance, signed ADRs, Scope or DoD. Canonical engineering documentation and identifiers use English; historical planning and the source Visual Bible are intentionally kept in Brazilian Portuguese without rewriting owner-approved source.

| ID | Topic | State | Current authority / details |
|---|---|---|---|
| CB-DEC-001 | Project working identity | USER SELECTED; LEGAL CLEARANCE OPEN | **CoinBlink**, international news portal about crypto; naming still requires similarity check (including Coinwink), domains and trademarks, no registration claims |
| CB-DEC-002 | Product language hierarchy | USER APPROVED | English `en` primary; `pt-BR` and `es` secondary, proper i18n from the start |
| CB-DEC-003 | Dark desktop homepage design | VISUALLY APPROVED | Owner-selected 1536×864 dark homepage is the exact Golden Home reference. Do not replace with an inspired template |
| CB-DEC-004 | Logo visual identity | VISUALLY APPROVED | Metallic eye/coin with lime flash and CoinBlink wordmark; source raster golden logo 1179×1040. A production SVG is not yet approved |
| CB-DEC-005 | Brand mood | VISUALLY APPROVED | Premium graphite/dark, restrained neon-lime green, dense editorial dashboard, glassmorphism, cinematic Bitcoin hero |
| CB-DEC-006 | Fidelity acceptance | USER REQUIREMENT | Visual diff / overlays against immutable source files; deterministic 1536×864 screenshot first; no 100% claim until measured |
| CB-DEC-007 | Light theme | USER REQUIREMENT | Dark baseline plus accessible light alternative; final light design not yet visually approved |
| CB-DEC-008 | Product operating model | USER SELECTED | Codex Cloud + GitHub + Cloudflare previews as development direction; local Docker alternative. Preview infrastructure NOT DEPLOYED |
| CB-DEC-009 | Engineering bootstrap | IMPLEMENTED | GEF `@gef-bootstrap/cli@1.1.2` + three pinned Matt Pocock Codex skills, audited in CB-BOOT-001 / PR #2 |
| CB-DEC-010 | Front-end stack | PROPOSED; ADR OPEN | Astro + React + TypeScript + Tailwind, selected Radix/shadcn, lightweight charts and Motion; validate with implementation constraints before ADR |
| CB-DEC-011 | Hosting/data stack | PROPOSED; ADR OPEN | Cloudflare Workers, D1, R2, caches, static/SSR hybrid; costs, quotas, deployment and security pending |
| CB-DEC-012 | Editorial AI | PRODUCT DIRECTION, CONTRACT OPEN | DeepSeek/AI-assisted research, primary-source evidence, fact-checking and original reporting. Exact JEV integration and decision gates require review |
| CB-DEC-013 | News distribution / monetization | PRODUCT DIRECTION, POLICY OPEN | Multisource news, X/Twitter distribution, paid banners/sponsor spaces; provider licenses, costs, user permissions unresolved |
| CB-DEC-014 | Master screenshot's headlines/prices | DEMO DATA ONLY | Do NOT publish screenshot mock numbers, dates or claims as factual/live news |
| CB-DEC-015 | Full architecture, scope, DoD, API contracts | NOT APPROVED | Product planning is OPEN, and historical ideas remain exploratory |
| CB-DEC-016 | Golden image file presence in Git | BLOCKED / NOT IMPORTED | Binary masters are preserved outside Git; intended paths/hashes in `assets/reference/reference-manifest.json`. Do not claim visual-ready source pack yet |

**Visual authority:** `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v1.0.md` explains the two Golden raster assets; if a sentence disagrees with the image, the **approved original image** is authoritative on visual appearance.

**Governance:** Owner future approvals must promote individual decisions via GEF rules; this ledger captures observed directions only. The past ideas Master is preserved intact for traceability, not promoted to engineering requirements.
