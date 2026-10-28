# CB-M01 · Aceite visual do Owner limitado à DEMO · 2026-10-14

**Tipo do registro:** transcrição documentada da autorização expressa do Owner nesta conversa; **não** é um `APPROVED` emitido pelo próprio Owner no GitHub e não substitui um parecer humano independente.

> **Declaração do Owner (14/10/2026):** “Aprovo o visual demonstrativo do M01 do Coinblink. Registre meu aceite visual limitado a DEMO no GitHub e avance com os próximos gates, sem merge ou publicação comercial automática.”

## Escopo concreto do aceite

- **Decisão:** `OWNER_VISUAL_ACCEPTED_FOR_DEMO=true`; para **revisão/previsualização demonstrativa** da homepage M01, não lançamento ou venda.
- **Arte apresentada:** captura real da homepage R26, desktop 1536×864, no diálogo anterior ao aceite: SHA-256 `d25afbcc0628507ea569ce3f6fbd581cc79a0f21a49b0ce6ef8911fd028a4c03`, proveniente do [Actions run #38606384643, artifact #11916385391](https://github.com/KayzenRoot/coinblink/actions/runs/38606384643/artifacts/11916385391). Existiam também capturas técnicas tablet 768×1024 (SHA-256 `ae3402257d8ec8bfe9c348e5732f8a9646bf6b217b96fda0ca2a00144e9b73ae`) e mobile 390×844 (SHA-256 `270f803f45fc5198ae6b977a824336091bbf7763b64a7af9020d0d2b8c1fb6ab`). A aprovação expressa do Owner se refere ao visual demonstrativo mostrado, sem estender automaticamente a layouts não exibidos.
- **PR examinada no instante deste registro:** [#58](https://github.com/KayzenRoot/coinblink/pull/58), HEAD `f0241686f123b0355989257722705aadce06803d`, protegida pela base `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`. R27 e R28 acrescentaram evidências de QA, não alteraram a interface desde a captura R26. Se um commit futuro modificar o visual, ele exige uma nova comparação, e mudanças materiais exigem nova decisão do Owner.
- **Origem canônica do still atual:** Codex/ImageGen, com animação opcional derivada no Blender. O aceite do visual **não muda a atribuição de proveniência**, nem converte o still em render Blender original.
- **Política de velocidade:** parar rounds de polimento visual sem problema de produto demonstrado ou novo pedido do Owner. Prosseguir com avaliação de bloqueios reais.

## Gates independentes (não liberados por este aceite)

| Gate | Estado depois da declaração |
|---|---|
| Aceite visual do Owner para **DEMO** | **ACEITO** (decisão expressa do usuário, transcrita neste registro) |
| Permissão para prévia interna/não pública | DEMO-only, conforme restrições atuais |
| `sharedReleaseGate.ownerVisualApproval` / aceite final para produto público | **PENDENTE**; não modificar o campo sem decisão distinta |
| Direitos de uso comercial das imagens, marca, logo e derivados | **PENDENTE**; `rightsReview=PENDING_OWNER_OR_LEGAL`, `licenseOrTrademarkClearance=NOT_ESTABLISHED` |
| Revisão independente humana elegível `APPROVED` no GitHub | **PENDENTE**, 0 aprovações no PR #58 durante esta revisão |
| Checks de CI | O HEAD anterior `f0241686f123b0355989257722705aadce06803d` tinha **6/6 success** em [Actions #38636113812](https://github.com/KayzenRoot/coinblink/actions/runs/38636113812); qualquer novo commit necessita CI no próprio HEAD |
| Diagnóstico de timeout visual local | **PENDENTE/ISOLADO**; falha M01 local sem causa provada, mas hosted CI verde |
| Timeout Wrangler fora do M01 | Issue [#71](https://github.com/KayzenRoot/coinblink/issues/71), sob triagem separada |
| M01 formal DoD/checkpoint, merge e deploy | **NÃO AUTORIZADOS**; `main` segue `M00_COMPLETE`, 5%, M01 `ADMITTED / NOT DONE` |
| Integração com M05 | **NÃO AUTORIZADA** sem gates de módulo e revisão próprios |

## Preservação dos controles

Não modificar `.engineering/CHECKPOINT.json`, rulesets, `sharedReleaseGate` comercial, estado das licenças, `authorizedToMerge=false`, workflows, assets, módulos externos ou publicação. Nenhuma permissão comercial ou aprovação humana pode ser inferida deste documento.

**STOP CONDITION deste registro:** aceite visual DEMO auditável no repositório e registrado na PR/Issue, seguido de triagem de direitos e revisão humana. O aceite do usuário **não** é uma autorização geral de integração.

## R83 · renewed Owner visual acceptance for the current main DEMO · 2026-10-18

**Current authority (supersedes historical acceptance scope only):** protected `main=7733fc4b9a17333db8381d94c94f33b9e24eb877`, complete tree `0ceab470c30a8eb0257007fe78f685555dc68f6d`, M01 component `8caa9e9322a6ee2333b81e1fd3b0a1736420d5f9`, integrated `/en` route `6688b6c582ffda1df6eb9b6be6ca8a3084cc1592`. Canonical checkpoint remains `M00_COMPLETE` at 5%. This appendix does not modify application, assets, public routes, cloud, module admission or checkpoint.

**Owner's renewed decision:** After reviewing the Golden master and current actual E2E desktop/tablet/mobile captures, the Owner responded: **“Aprova siga adiante e feche os módulos 1 e 5 definitivamente”**, following the question **“Você aprova o visual atual como base DEMO do M01, com essas diferenças documentadas?”**. This is affirmative **`OWNER_VISUAL_ACCEPTED_FOR_DEMO=true`** for the present M01 build and its documented truthful DEMO divergences. It is **not** a standalone Owner `GO` to merge a future PR whose exact final HEAD did not yet exist, publish cloud content, enable remote D1, provision a secret, or promote a checkpoint without completed DoD.

**Concrete visual differences accepted for DEMO:** Golden's fictional market rates, breaking news and sentiment must never be marketed as fresh LIVE; current safe/no-feed/preview labels and controls are intentionally non-live. Visual differences in editorial artwork, category iconography, promotional imagery and desktop fold placement are acknowledged. No pixel-perfect claim. Original approved Golden asset bytes stay immutable. Future material layout changes require a new visual comparison and Owner acceptance.

**Exact-main verification:** [GitHub Actions GEF #39113571532](https://github.com/KayzenRoot/coinblink/actions/runs/39113571532) `SUCCESS` on that exact main, Ubuntu/Windows 431/431 Node tests and 48/48 Playwright each, Docker success. Golden file hash/size/dimensions tests pass, `/en` actual integrated Wrangler-local browser tests pass on desktop 1536×864, tablet 768×1024, mobile 390×844 with HTTP 200, no document overflow and 0 full-page Axe violations. M01 integrated visual capture hashes in [Issue #8 R81](https://github.com/KayzenRoot/coinblink/issues/8#issuecomment-6248053355). The separately downloaded general M00 Playwright ZIP artifact #12131786473 is **not** the M01 integrated screenshot set; its provenance is itemized in [R82](https://github.com/KayzenRoot/coinblink/issues/8#issuecomment-6248125103). [Owner decision record](https://github.com/KayzenRoot/coinblink/issues/8#issuecomment-6248164673).

**Only gates superseded:** the old instruction requiring mandatory independent *human* GitHub reviewer and trademark/IP paperwork as engineering module DoD is historical: `.engineering/SOURCE-HIERARCHY.md` now sets sole Owner `KayzenRoot` review with strict checks/security evidence and excludes commercial-brand paperwork from engineering integration gates. This does **not** represent commercial rights clearance or a deployment permission.

**Still separate for module DONE:** accepted technical P1/P2 matrix and evidence, assessment of protected Cloudflare M01 Preview requirement (existing M00 Preview is not current M01 deployment), exact-final-head mandatory checks and outstanding threads, and explicit Owner checkpoint-promotion/merge GO. No promotion from this documentation update. `CHECKPOINT_DELTA={}`; `STOP=M01_OWNER_DEMO_VISUAL_ACCEPTED_CLOSURE_GATES_REMAIN`.
