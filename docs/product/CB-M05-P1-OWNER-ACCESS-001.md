# CB-M05-P1-OWNER-ACCESS-001 — Work Order HIGH_ASSURANCE (PROPOSTA / LOCAL)

**Estado:** `DRAFT_PR / DOCUMENTATION_ONLY / LOCAL_DIRECTION_RATIFIED / NOT_ADMITTED / NO_CODE_AUTHORITY / NO_PRODUCTION_AUTHORITY`  
**Repositório:** `KayzenRoot/coinblink` · **Data:** 2026-10-24  
**Context Lock:** `main=6c7c1e5c47129d954c26ee5eb6a344b7ca177cd5`  
**Owner:** único humano; **classificação:** HIGH_ASSURANCE; **deploy, D1 remoto, secrets reais e publicação:** PROIBIDOS.  
**Autorização atual:** somente criação da branch documental isolada e PR **Draft com estes três docs**. Não há GO de implementação, teste novo executado, Ready ou merge.

## 1. Objetivo da futura fatia LOCAL

Provar **num laboratório isolado** a fronteira de uma única identidade Owner, passkey-first, ticket efêmero de claim, sessões revogáveis e uma resposta privada mínima **somente leitura**. Todos os dados e autenticadores são artificiais e descartáveis. Não criar conta Owner real, rotas produtivas, integração remota, administração de provedores, publicação ou monetização.

### Definition of Done LOCAL proposta

1. `owner_id=1` imposto no D1 de teste e transação: concorrência 2/10/100 reivindicações produz no máximo um Owner efetivo e nenhum registro parcialmente privilegiado.
2. Registration/authentication WebAuthn com `@simplewebauthn/server` 14.0.3 já presente, ES256 em fixtures geradas em runtime, challenger origin/RP ID/UP/UV/single-use, segundo autenticador criptograficamente distinto. Credenciais REAL e independência física: `NOT_RUN`.
3. Ticket LOCAL único e expirável sem endpoint público de emissão, replay impossível, estado transacional.
4. Token de sessão opaco com pelo menos 256 bits, digest HMAC no D1 de teste, revogação, expiração idle de 30 minutos e absolute de 12 horas **como alvo LOCAL ratificado**. Cookie `Secure`, `HttpOnly`, `SameSite`, `__Host-` e sem `Domain`.
5. Leitura privada mínima somente após `authorizeOwner()` server-side, nenhuma consulta sensível antes da autorização; negações homogêneas a usuários anônimos, header `x-owner-role` falso, CSRF/cookie inválidos, origem atacante, timeout e D1 indisponível.
6. `/admin` fora DEV **404 preservado**. Nenhum acesso a rascunhos reais, Provider Vault, settings real, API comercial ou publicação.
7. Testes hospedados RED primeiro, depois GREEN em Node/Workerd-D1 local/Chromium, regressões M05 e partes dependentes, gates CI/SonarCloud/Socket no HEAD exato e Evidence Bundle sem credenciais, outputs raw ou dados reais.
8. Nenhuma afirmação de medição de cobertura nova sem LCOV instrumental importado; SonarCloud `0,0%` de cobertura medida continua ressalva.

## 2. Inventário candidato congelado — futura implementação LOCAL de 13 caminhos

Estes caminhos são **um envelope de revisão**. A PR documental atual adiciona somente #01–#03; #04–#13 só poderão existir após GO LOCAL separado. Se código precisar tocar `package-lock.json`, `wrangler.jsonc`, middleware, rota pública ou migration remota, **STOP** e abrir WO separada do Integration Steward.

| # | Caminho | Responsabilidade / permissões futuras |
|---|---|---|
| 01 | `docs/architecture/ADR-CB-M05-P1-OWNER-ACCESS-001.md` | Arquitetura ratificada como direção LOCAL |
| 02 | `docs/security/CB-M05-P1-OWNER-ACCESS-THREAT-MODEL.md` | Ameaças e controles HIGH_ASSURANCE |
| 03 | `docs/product/CB-M05-P1-OWNER-ACCESS-001.md` | Esta Work Order e STOP |
| 04 | `src/modules/CB-M05/p1-owner/access-policy.mjs` | Autorização de leitura privada local |
| 05 | `src/modules/CB-M05/p1-owner/claim-guard.mjs` | Claim atômico singleton |
| 06 | `src/modules/CB-M05/p1-owner/passkey-session.mjs` | Adapter do verificador existente e sessões |
| 07 | `src/modules/CB-M05/p1-owner/readonly-view.mjs` | Resposta mínima local |
| 08 | `test/modules/CB-M05/p1-owner-fixtures/schema.sql` | Novo schema D1 de teste; nunca migração real |
| 09 | `test/modules/CB-M05/p1-owner-policy.test.mjs` | Negativas e positivas Node |
| 10 | `test/modules/CB-M05/p1-owner-race.test.mjs` | Corridas e falhas de batch D1 local |
| 11 | `e2e/m05-owner-access.spec.mjs` | Chromium, WebAuthn virtual, axe, reflow |
| 12 | `.github/workflows/m05-owner-access.yml` | CI read-only, sem secret/cloud remotos |
| 13 | `.engineering/evidence/CB-M05-P1-OWNER-ACCESS-001/EVIDENCE-BUNDLE.md` | Evidência de RED→GREEN futura |

Os nove contratos-chave já existentes devem ser **reutilizados sem edição nesta WO LOCAL**, salvo autorização específica para desdobramento futuro: `src/modules/CB-M05/p1c-local/local-cms.mjs`, `local-admin-router.mjs`, `p1b-local/webauthn-fixtures.mjs`, `test/modules/CB-M05/p1c-fixtures/schema.sql`, `p1b-webauthn.test.mjs`, `p1c-local-cms.test.mjs`, `.github/workflows/m05-local-cms-browser.yml`, `src/pages/admin/[...route].js`, `wrangler.jsonc`.

**Colisão com outras PRs:** não modificar código/arquivos da PR #201 de parser M05 nem ECC #209; revisar PRs abertas e comparar blobs do Context Lock imediatamente antes da execução.

## 3. Decisões ratificadas versus futuras aprovações

| ID | Direção ratificada somente para planejamento LOCAL | O que ainda exige GO |
|---|---|---|
| D01 | Passkey/WebAuthn principal, sem fallback senha/TOTP nesta fatia | Código/runtimes/versões auditados e aceitação formal de risco |
| D02 | Duas credenciais distintas, objetivo de fatores independentes | Comprovação física/recovery real e política de equipamentos antes de PROD |
| D03 | Sem cerimônia offline aprovada, perda total resulta em acesso negado | Emissor, verificação independente, custódia, espera, fraude, revogação |
| D04 | Ticket de bootstrap externo, expira e só serve uma vez; fixtures LOCAL | TTL/taxas exatas, emissor real e processo de ativação fora do app |
| D05 | Sessão LOCAL: 30 minutos idle, máximo de 12 horas absoluto, revogação | Quotas/rate-limit final e revisão operacional de PROD |
| D06 | Origem HTTPS administrativa real ainda não selecionada | Domínio, RP ID, TLS, isolamento de staging/Preview antes de PROD |
| D07 | Envelope de 13 arquivos como proposta | Autorização explícita nova de branch/PR para código LOCAL após merge documental |

Nenhuma decisão de direção muda retrospectivamente `COINBLINK_SETTINGS_AND_SINGLE_OWNER_v2.0_DRAFT.md`; divergência senha+MFA permanece documentada e **somente esta futura fatia LOCAL** usará passkey-first como proposta.

## 4. Plano de execução futuro, ainda NÃO AUTORIZADO

1. **Admissão:** review dos três documentos, checks da PR Draft documental, autorização Owner separada do merge e readback de `main`; se qualquer gate falhar, manter Draft/STOP.
2. **Preflight de código:** confirmar novo HEAD de `main`, blobs críticos, patches pendentes e ausência de colisões no envelope 13; exigir GO explícito para branch + PR Draft LOCAL.
3. **RED genuíno:** commit somente de novos testes/CI nos caminhos admitidos antes do código; apresentar falhas Node porque funções/contratos ainda faltam; falha de package/env não constitui RED.
4. **GREEN:** implementar apenas os quatro módulos de acesso local e schema fixture; não reescrever verificador, não mover credenciais de fixture, não tocar `/admin` fora DEV.
5. **Hardening:** 2/10/100 concorrentes, WebAuthn assinatura e challenge, CSRF, cookie, session fixation/replay, corrupção e indisponibilidade D1, preview isolation, ausência de material sensível e publicação.
6. **Regressão:** manter P0/P1A/P1B/P1C existentes, bridge M05→M02, build, lint, typecheck, Chromium/axe, scans exatos e Evidence Bundle no HEAD final.
7. **STOP/merge:** PR LOCAL continua Draft até GO separado; merge nunca automático. Mesmo merge LOCAL não concede P1 PROD.
8. **PROD futuro:** WO Integration Steward separada para domínio, binding remoto, migrations versionadas, secrets, rollouts, backup/restore, domínio/RP e tráfego seguro com aprovação Owner.

## 5. Matriz de testes RED→GREEN obrigatória para futuro GO

| Caso | Prova para GREEN | Tipo |
|---|---|---|
| OWN-01 | Concorrência 2/10/100, <=1 Owner e sem transação parcial | Workerd/D1 LOCAL |
| BOOT-01 | Ticket wrong-origin/expired/replay e público negados | Node + D1 |
| WA-01 | Assinaturas ES256 genuínas; wrong COSE/CBOR e assinatura adulterada negados | Node crypto |
| WA-02 | Chave distinta, origin, RP ID, UP/UV, finalidade, action e counter validados | Node + Chromium virtual |
| WA-03 | Challenge consumido atomicamente, contador zero não permite replay | Workerd D1 |
| REC-01 | Segunda credencial independente como política, perda total negada | Node; prova física NOT_RUN |
| SES-01 | Expiração idle/absolute, logout, rotação, revogação, cookie/counter replay | Node + Chromium |
| CSRF-01 | Cross-site, Fetch Metadata, Origin, content-type e anti-CSRF inválidos negados | Request API |
| PRIV-01 | GET privado sem auth nega **antes de tocar dados**; IDOR/header role negados | D1 spy |
| D1-01 | Falha de batch/rollback preserva singleton e ticket não consumido parcial | Miniflare |
| ENV-01 | Não há cloud, secrets, D1 remoto ou permissões de escrita no Preview | Static/CI |
| PUB-01 | Nenhum endpoint, autorização ou evento que publique conteúdo | Static/Node |
| A11Y-01 | axe e 320/390/768/1366 sem reflow horizontal | Chromium |
| REG-01 | M05 LOCAL original e M02 editorial bridge mantêm GREEN | CI |
| SCAN-01 | Build, lint/typecheck, Gitleaks, Sonar 0 novos issues/hotspots, Socket PR Alerts + Project Report, PR Assurance, Reviewdog | Checks HEAD |

**Evidence:** cada PASS precisa de comando, versão, runtime, SHA e resultado. `NOT_RUN`, skipped, quota de bots, scanner indireto ou 0,0% de cobertura medida não substituem execução. Sem despesas para CI e sem provider externo.

## 6. STOP CONDITIONS e limites de autoridade

- Mudança de `main` ou blobs críticos; escopo excedido; branch desatualizada; PR paralela tocando os mesmos arquivos.
- Qualquer real secret, credential, token, e-mail pessoal ou identidade privada em source/log/CI/print.
- Tentativa de abrir `/admin` em produção, incluir Cloudflare binding remoto, criar D1 remoto, mexer no `wrangler.jsonc`, integrar PR Preview com secrets, fazer migração remota ou impor custo.
- Falha em isolamento D1, Origin/RPID/UV, recovery, concorrência, sessões ou revogação; Sonar/security findings sem tratamento.
- Falsa alegação de pronto para produção, publicação autorizada, cobertura medida maior que instrumentada, testes `NOT_RUN` marcados `PASS`.
- Sem Ready/merge nesta PR documental, sem nova autorização específica. ECC #209, outras PRs, rulesets, checkpoints e `main` protegidos.

**Veredito documental:** `SCOPE_READY_FOR_REVIEW / DOCUMENTATION_ONLY / NOT_ADMITTED / CODE_NOT_AUTHORIZED / PRODUCTION_NOT_AUTHORIZED`.
