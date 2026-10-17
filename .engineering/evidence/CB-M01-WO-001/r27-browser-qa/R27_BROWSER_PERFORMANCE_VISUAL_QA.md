# R27 Browser, Performance, and Visual QA

**Result:** `R27_DEMO_QA_PASS` for the local demonstration preview. Aggregate test validation remains partial because several unrelated fixture screenshot checks timed out in full-suite runs.

**Repository:** `KayzenRoot/coinblink`

**Base:** `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`

**Tested application HEAD:** `3da9f857c0566c499175427919873dbc7d52f145`

**Preview:** `http://127.0.0.1:3001/en` (existing local Docker Compose service; left online)

**Runtime:** Node.js `v22.23.3`, Windows x64

## Browser and visual checks

Chromium `156.0.8078.4` and Microsoft Edge `155.0.4283.45` passed desktop (`1536×864`), tablet (`768×1024`), and mobile (`390×844`) captures. All six captures returned HTTP 200, had zero axe violations, no horizontal overflow, no console or page errors, and no external requests. The keyboard skip link receives visible focus. The 200% equivalent was represented by a `768×432` CSS viewport; browser chrome zoom itself was not controlled. Firefox and WebKit binaries were absent, and no downloads were attempted.

R26 desktop geometry matched exactly in both tested browsers (all recorded geometry deltas were zero). Promo and editorial derivatives decoded at `1200×600` and `768×512`. The report JSON contains all viewport measurements and the 27-image source hash inventory.

| Capture | Bytes | SHA-256 |
| --- | ---: | --- |
| Chromium desktop | 1,275,671 | `ba368a74fcaea71f5bfd5fe44149631f4e35bb5b65d32c64bd4d1b82a0b6d192` |
| Chromium tablet | 917,986 | `1fbcb803de84adeefea424ad4a3db90ddc88563887ccd958e92c247256420a72` |
| Chromium mobile | 914,297 | `ae5f16958a55664955505c6b00454af51389d17a271bd805deed46f8c6b08d13` |
| Edge desktop | 1,204,608 | `87675c38be13818e71687989282a39c5a988e53253ac216ab4eee38cc9ec76ec` |
| Edge tablet | 863,876 | `7af0c9ecb8159ab3fa7f8c6c45ed7261de6e942be4d6425229f1bed65ec0bfe7` |
| Edge mobile | 878,571 | `04e4a7856e1201e514e0b4fb3c123332558b4e8ec2bcd99841b4cd13585871fc` |

## Media selection, fallback, and transfer checks

Seven selection cases passed: reduced motion, Save-Data, `slow-2g`, `2g`, and `3g` selected the static image; no-preference `4g` selected motion. After changing the emulated connection from `4g` to `3g`, selection changed to static on reload.

Five simulated failure cases passed: motion to static WebP, static WebP to PNG, PNG failure to vector, promo/editorial image failures to original illustrations, and complete hero failure to vector. No broken visible images, repeated retries, or external requests were observed. Eight distinct image URLs served from Docker matched checkout byte lengths and SHA-256 values (`servedAssetHashes.status=VERIFIED`).

Three cold-cache repetitions were recorded for each profile:

| Profile | LCP range | Max CLS | Long tasks | Hero transfer / encoded | Same-origin transfer per run |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop motion | 1.436–1.688 s | 0.000055 | 0 | 1,395,024 / 1,394,724 bytes | 1,435,920 bytes |
| Mobile static, 3G + Save-Data | 1.128–2.128 s | 0 | 0 | 310,354 / 310,054 bytes | 873,466 bytes |
| Mobile motion, 4G | 0.968–1.496 s | 0 | one 54 ms task | 1,395,024 / 1,394,724 bytes | 1,958,136 bytes |

These are lab observations from one local PC and Docker preview, not field Core Web Vitals. The image decode figure is an `HTMLImageElement.decode()` completion probe after load; it does not measure animation-frame decode cost.

## Reproducible checks and limitations

Run the browser harness and served-asset verifier with the project dependencies installed and the local Docker preview available:

```powershell
node .engineering/evidence/CB-M01-WO-001/r27-browser-qa/r27-browser-performance-visual-qa.mjs
node .engineering/evidence/CB-M01-WO-001/r27-browser-qa/r27-verify-served-assets.mjs
```

| Check | Result |
| --- | --- |
| R27 browser harness, Node 22 | Pass: Chromium and Edge; 6 viewport captures, selection/failure matrices, 9 cold-cache runs |
| Served asset SHA/length verifier | Pass: 8/8 served image paths match source |
| `npm test` | 191/192; one Astro fixture readiness timeout in `visual-check.mjs`; isolated rerun passed 1/1 |
| `npm run test:unit -- --test-concurrency=1` | 191/192; one Astro fixture readiness timeout in `integrated-visual-check.mjs`; isolated rerun passed 1/1 |
| `npm run test:e2e` | 31/34; three M00 viewport screenshot cases timed out in the full batch; the exact desktop, tablet, and Portuguese mobile cases passed on isolated reruns (1/1 and 2/2) |
| `npm run lint` | Pass after adding browser globals for the R27 harness |
| `npm run typecheck` | Pass: 79 files, zero diagnostics |
| `npm audit --audit-level=high` | Pass: zero vulnerabilities |
| `npm run build` | Pass |
| Node 22 syntax checks for both R27 scripts | Pass |

The timeouts were not reproduced by the isolated reruns; they remain reported as aggregate-run limitations. No M01 product defect was reproduced and no product source file was changed in this R27 evidence update.

Blender was not installed in PATH or the checked standard install directories, so R27 did not reopen or render the `.blend` project. The portable animation source previously inspected in R26 remains `hero-cinematic-animation-portable.blend`, SHA-256 `898b99ff862f141f27871a2979a1a383fb7a60c3349a0810af2b6fcbafa6d8ec` (4,249,267 bytes); that prior hash match is not a new Blender validation.

## Governance

This is demonstration QA evidence only. `authorizedToMerge=false`; PR #58 and Issues #8/#60 remain open. No merge, deployment, checkpoint promotion, ruleset change, or commercial/visual approval is authorized or claimed. M01 is not declared complete; Owner visual and rights review remains separate.
