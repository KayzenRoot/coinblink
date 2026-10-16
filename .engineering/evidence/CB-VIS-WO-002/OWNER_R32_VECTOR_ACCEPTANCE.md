# CB-VIS-WO-002 · Owner's explicit R32 vector approval (evidence)

**Evidence status:** `OWNER_VECTOR_APPROVAL=ACCEPTED_FOR_DEMO` on the exact R32 candidate listed below. This file **records**, but does **not itself effect**, Work Order admission, commercial rights, production release or GitHub merge. Governance proposal at `.engineering/proposals/CB-VIS-WO-002-SCOPE-ADMISSION.md`.

## Source of Owner approval

On **2026-10-14**, after the R32 contact sheet, five SVG variants and ZIP were presented, Owner answered exactly: **"Aprovo"**. This is **specific visual approval of these R32 vector candidates**, distinct from earlier Owner M01 demo-only homepage acceptance.

The [canonical Issue #74](https://github.com/KayzenRoot/coinblink/issues/74) now records that decision, the contact sheet SHA, zip checksum and every candidate SHA. An earlier Codex R33 `OWNER_VECTOR_APPROVAL_PENDING` failure correctly reflected the old state; that gate is now **SATISFIED**.

## Exact approved local-source bytes, verified 2026-10-14

| Name | Size (bytes) | SHA-256 |
|---|---:|---|
| Contact sheet `coinblink-brand-preview.png` | 199303 | `8bb05c36dead19d231ae4d87004904ed8aa7202f99fcaf6b099bec5a6817f6f9` |
| ZIP `COINBLINK_BRAND_VECTOR_R32.zip` | 1004323 | `145dd33b98812d445688150065199a7f3b6954e974fb2b1de6381c14e5e69b48` |
| `coinblink-symbol.svg` | 4042 | `240d6e4c7e929920f0b7cbef37278aea09b6e55ac405e2d34ed7e55368a01de2` |
| `coinblink-horizontal-dark.svg` | 18085 | `9da72437b4df9d896b85d8fc313e6734dd21db6905d7a5cf7419f0e353b3ab8c` |
| `coinblink-horizontal-light.svg` | 18087 | `f054553a21372a5ca44837e6c75cf96450e461afbb49ed4629ffb5c2ee032825` |
| `coinblink-stacked.svg` | 18040 | `707ac8a765cf99aa1dcd2b74364fac7b650238f78aaebfc392b6cec281adcfdd` |
| `favicon.svg` | 3718 | `0f446faef5fc69f4bdc76fffa03cf0b0e6feb6e4ddb4aceefce8e97e4d1e6e16` |

The ZIP integrity check passed. When Codex receives the ZIP, it **must recompute** every hash and reject any mismatch. Do not claim the ZIP content itself was uploaded to GitHub by this governance proposal. Do not claim pixel-identical redraw of original Golden AI-generated logo.

## Preserved gates

- `ownerVectorApproval=ACCEPTED_FOR_DEMO` applies only to these five R32 candidates, **not** unrelated future logo modifications or unrestricted site-wide edits.
- The original reference JPEG `assets/reference/coinblink-logo-approved-original-1179x1040.jpg` remains immutable, known SHA-256 `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0`.
- **Brand Work Order admission:** NOT YET EFFECTIVE; separate Owner admission decision + reviewed governance change required.
- `rightsReview=PENDING_OWNER_OR_LEGAL`, `commercialPublicationAllowed=false`; [rights Issue #72](https://github.com/KayzenRoot/coinblink/issues/72) remains OPEN.
- No merge, deploy, M01 completion or checkpoint promotion.
