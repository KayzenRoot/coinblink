# ADR-CB-M05-P1-OWNER-ACCESS-001 — Único Owner, passkeys e fronteira de produção

**Classificação:** HIGH_ASSURANCE  
**Estado da proposta:** DRAFT_PR / LOCAL_DIRECTION_RATIFIED / NOT_ADMITTED / NOT_EFFECTIVE  
**Autoridade:** ratificação pelo Owner, em 2026-10-24, somente da direção arquitetural LOCAL; a presente PR é **exclusivamente documental**.  
**Context Lock (SHA exato):** `6c7c1e5c47129d954c26ee5eb6a344b7ca177cd5` em `KayzenRoot/coinblink/main`.  
**Limite:** este ADR não habilita código, /admin produtivo, D1 remoto, credenciais reais, Cloudflare IAM, migrações, secrets reais, publicação, gasto, Ready, merge nem deploy.

## 1. Decisão ratificada: arquitetura apenas para futura prova LOCAL

O Owner ratificou **como direção de planejamento** para CB-M05-P1-OWNER-ACCESS-001:

1. Astro com o adaptador Cloudflare Worker já presente, mas **testes inicialmente isolados** em Workerd/Miniflare e D1 exclusivamente LOCAL.
2. Exatamente **uma identidade humana** Owner, com claim atômico único; sem cadastro público, convite de segundo administrador ou privilégios de cliente de API.
3. **Passkey/WebAuthn como autenticação primária, sem fallback por senha/TOTP nesta fatia LOCAL**; reutilizar o verificador `@simplewebauthn/server` 14.0.3 já fixado, sem implementar criptografia caseira.
4. **Duas credenciais distintas**, com objetivo de recuperação independente. Duas cópias sincronizadas na mesma conta não bastam como prova de independência física; material físico real permanece NOT_RUN.
5. Ticket de bootstrap **externo à aplicação pública**, curto e de uso único, ligado a propósito, ambiente e origem; nesta fatia, somente tickets sintéticos criados em runtime de testes.
6. Quando ambos os fatores forem perdidos, **negar por padrão**. O procedimento de recuperação offline para perda total só poderá operar após ADR, threat model, cerimônia, controles antifraude e aprovação separados.
7. Sessões opacas revogáveis no servidor; token de alta entropia, apenas digest HMAC no banco, cookie Secure/HttpOnly/SameSite/host-only. **Parâmetros LOCAL para a futura prova:** 30 minutos de inatividade e duração absoluta máxima de 12 horas, com revogação e rotação.
8. Material secreto fora do banco e do código-fonte; somente segredos descartáveis em testes locais. Origem HTTPS e RP ID administrativos **não definidos** para produção.
9. A primeira UI futura será **somente leitura**, sobre estado sintético da sessão/Owner, sem rascunhos reais, nenhuma escrita editorial, publicação, vault, consumo de API paga ou dados licenciados.

Ratificação da direção **não significa autorização de execução**. A futura implementação requer Work Order admitida, Context Lock reconfirmado, branch/PR e GO explícitos adicionais. A integração produtiva exigirá aprovação completamente separada.

## 2. Precedência, ADRs existentes e colisões semânticas

| Fonte atual | Contrato efetivo para esta proposta |
|---|---|
| `docs/architecture/ADR-CB-M05-P1-SECURE-OWNER-CMS-PROPOSAL.md` | Texto geral **PROPOSED / NOT EFFECTIVE / NO P1 CODE AUTHORITY**; não pode ser reinterpretado como GO. |
| `docs/architecture/ADR-CB-M05-P1C-SINGLE-OWNER-ADMIN-BOUNDARY-001.md` | Decisão anterior **LOCAL-only**; histórico e indicação de adoção pendente não autorizam produção. |
| `docs/design/COINBLINK_SETTINGS_AND_SINGLE_OWNER_v2.0_DRAFT.md` | O documento descreve senha + MFA como alternativa. **Para esta futura fatia LOCAL proposta**, prevalece a direção passkey-first sem senha; NÃO altera ou aprova retroativamente Settings para produção. |
| `docs/architecture/contracts/CB-M05.md` | Autorização server-side obrigatória e separação de usuários/bots de Owner; P1 de produção continua gated. |
| `src/pages/admin/[...route].js` | O guard de produção `!import.meta.env.DEV` continua intacto. Não tocar nesta WO documental ou futura LOCAL. |
| `src/modules/CB-M05/p1c-local/**` | Laboratório WebAuthn/D1 **sintético** existente; fonte de contratos e testes, não fonte de identidade real. |
| `test/modules/CB-M05/p1c-fixtures/schema.sql` | Fixture de teste, **nunca uma migração remota pronta para aplicar**. |
| `wrangler.jsonc` / `package.json` | Sem binding D1 produtivo aprovado. A biblioteca WebAuthn consta em `devDependencies`; mover para runtime/bundle exige futuro review de lockfile, advisories e Integration Steward. |

Esta PR adiciona um candidato mais específico e **não altera** esses ADRs existentes. Em caso de conflito, não se pode reivindicar que um documento DRAFT substitui uma decisão canônica ou autoriza produção. A precedência do passkey-first aqui é *somente um escopo de planejamento LOCAL ratificado*; adoção canônica requer merge documental autorizado e, para código, GO posterior.

### Context Lock: blobs críticos do ponto de partida

- `src/pages/admin/[...route].js`: `91a90f33c591616952d5b767cf7bed6c6cf57c91`
- `src/modules/CB-M05/p1c-local/local-cms.mjs`: `dbaa91335ef0191f26305c94d2021bb2c4f1fb7e`
- `src/modules/CB-M05/p1c-local/local-admin-router.mjs`: `64aac0708cd1bc088c6b9cb083ccc1419924cd44`
- `test/modules/CB-M05/p1c-fixtures/schema.sql`: `cc862472a81e3f50e25e761179da43f7811492da`
- `wrangler.jsonc`: `980a4af6a5c3cd40a37797ad53d27530a54bbbe2`
- `package.json`: `eed320228166097da9ab8839149350e2706f05fa`
- `.github/workflows/m05-local-cms-browser.yml`: `44aaa3f9fb0d8ece0328af8e68bb86744ff65ea5`
- `docs/architecture/ADR-CB-M05-P1C-SINGLE-OWNER-ADMIN-BOUNDARY-001.md`: `6a590ef487556ed62296f558296b6ad5a334d3dc`
- `docs/architecture/ADR-CB-M05-P1-SECURE-OWNER-CMS-PROPOSAL.md`: `e5a0054773fa8f6c669ab3861f8cc71bcea73886`

Se `main` ou qualquer blob crítico mudar antes de executar o futuro código, o Context Lock será `STALE`; exigir novo preflight, nunca fazer rebase silencioso de decisões.

## 3. Política de identidade, autenticação e sessão

- Identidade imutável `owner_id=1`, imposta por constraint + transação no D1 de teste. Concorrência de 2, 10 e 100 pedidos: **no máximo um claim efetivo**, sem criação parcial ou ticket reutilizado.
- WebAuthn com desafio aleatório do servidor, expiração, single-use atômico, assinatura validada pela biblioteca, credential ID/public key, action binding, origin e RP ID exatos, UP+UV obrigatórios; sign counter e flags BE/BS avaliados sem inferir independência de sincronização.
- Bootstrap LOCAL deve ser reproduzível em testes sem ticket/segredo em logs. **Não existe endpoint de geração de ticket público**. O fluxo real de ativação depende de definição separada de emissor, custódia e evidência.
- Sessão criada/rotacionada após autenticação, expira por idle (30 min) e limite absoluto (12h), é revogável por logout, troca de credencial, incidente ou recuperação. Cookie sem `Domain` e sem exposição JS. Toda leitura privada requer autorização **antes** de consultar dados.
- Métodos inseguros, caso existam no laboratório, exigem Origin/Fetch Metadata, CSRF e idempotência. Testes com cookie falso, velho, revogado, duplicado, criado em origem errada ou header de papel forjado devem negar acesso, mesmo com UI habilitada.
- Falha de D1 ou secret obrigatório resulta em indisponibilidade/negação, **nunca fallback LOCAL→remote**.

## 4. Isolamento e continuidade

- A futura WO LOCAL não tocará `src/pages/admin/[...route].js`, `wrangler.jsonc`, Preview global, migrations reais, root account, DNS, produção ou segredos reais.
- `owner.example.test` é **apenas origem fixture**. Não pode ser promovida como RP ID/domínio de produção; Previews de PR não podem herdar bindings privilegiados ou origem WebAuthn confiável.
- Um esquema LOCAL isolado precisa provar transações, integridade, rollback e revogação, mas não certifica performance, segurança IAM nem compatibilidade D1 remoto. Preparar migrações versionadas e rollback em outra Work Order depois da autorização do Integration Steward.
- Time Travel da D1 Free tem janela documentada de 7 dias (Paid 30); restaurar substitui o estado do banco escolhido. Antes de D1 remoto: confirmar plano/quotas, backup/export separado, destino exato, ensaio em cópia descartável, RPO/RTO e autorização específica.
- Custódia de futuros secrets em binding de Worker/gerenciador aprovado separado da persistência. Não depositar tokens em `vars`, banco, README, bundles, telemetria, prints ou artifacts.

## 5. Alternativas rejeitadas neste escopo

Ativar `/admin` por flag; copiar a identidade do teste para produção; criar verificador de assinatura caseiro; aceitar duas cópias da mesma credencial como fatores independentes; habilitar email-only recovery; criar D1 remoto no RED; introduzir credencial/secret real; publicar conteúdo de licenças não liberadas.

## 6. Autoridade, gates e STOP

1. **Agora autorizado:** somente branch documental + PR Draft com ADR, threat model e Work Order, exatamente três caminhos novos.
2. **Ainda NÃO autorizado:** Ready, merge documental, criação de módulo/rota/testes de código, credenciais, D1 remoto, Worker público, gasto, mudança de `main`, ECC #209, outras PRs, rulesets ou checkpoints.
3. **Depois, com autorização separada:** admissão da execução LOCAL de 13 arquivos, RED→GREEN hospedado e gates HIGH_ASSURANCE.
4. **Depois disso, com autorização independente:** integrar /admin e identidade REAL em produção com origem, migração, backup, recovery e rollout revisados.

**STOP CONDITION:** `OWNER_ACCESS_P1_NOT_ADMITTED / PRODUCTION_PRIVILEGES_DENIED / NO_CODE_AUTHORITY`.

Referências técnicas: https://simplewebauthn.dev/docs/packages/server · https://developers.cloudflare.com/workers/configuration/secrets/ · https://developers.cloudflare.com/d1/reference/migrations/ · https://developers.cloudflare.com/d1/reference/time-travel/
