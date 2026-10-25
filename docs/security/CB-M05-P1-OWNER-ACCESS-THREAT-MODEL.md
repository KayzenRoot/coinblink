# CB-M05-P1-OWNER-ACCESS-THREAT-MODEL — Modelo de ameaças HIGH_ASSURANCE

**Estado:** `DRAFT_PR / LOCAL_DIRECTION_RATIFIED / NOT_ADMITTED / NOT_EXECUTED`  
**Data:** 2026-10-24 · **Repositório:** `KayzenRoot/coinblink`  
**Context Lock:** `main=6c7c1e5c47129d954c26ee5eb6a344b7ca177cd5`  
**Autoridade:** somente documentação para futura prova LOCAL, sem código, cloud, credencial real, publicação, D1 remoto, deploy, Ready ou merge.

## 1. Escopo e modelo de confiança

**Ativos:** identidade Owner singleton, tickets de ativação sintéticos, desafios WebAuthn, chave pública registrada, flags de backup e contadores, cookie opaco, HMAC e rotação, revogação, D1 de teste, logs sanitizados, origem/RP ID futuros e integridade do código do CMS.

**Adversários:** usuário anônimo, bot de bootstrap, dispositivo/conta sync comprometidos, portador de cookie roubado, atacante controlando Origin/Host/CORS, extensão maliciosa, autor de PR Preview, operador com privilégios excessivos, pessoa com acesso ao Git público, atacante que produz concorrência D1 e falhas de Worker, terceiro que tenta recuperar o único Owner sem prova suficiente.

**Fronteiras:** browser ↔ Worker/adapter de teste; Worker ↔ D1 **LOCAL**; Worker ↔ valor secret temporário; commits/CI públicos ↔ material operativo futuro; laboratório `/local/**` ↔ `/admin/**` produtivo. Não confiar em flags no browser, `owner` enviado em header, presença de cookie sem validação, endpoint DEV ou `owner.example.test` como identidade de produção.

## 2. Matriz de riscos, controles e evidências futuras

| ID | Cenário adversarial | Mitigação obrigatória | Prova pretendida |
|---|---|---|---|
| T01 / OWN | Dois ou mais claims de Owner simultâneos | Singleton no D1 e transação atômica; ticket single-use | Concorrência 2/10/100, <=1 claim e sem parcial |
| T02 / BOOT | Ticket expirado, roubado ou reutilizado | Ticket emitido externamente, bound a propósito/origem/ambiente, consumo único | Replay, TTL, ambiente divergente, concorrência |
| T03 / WA1 | Assinatura WebAuthn falsa ou credencial substituída | Verificador 14.0.3 com chave pública registrada e algoritmo admissível | Assinatura válida passa, alterações CBOR/COSE e ID negadas |
| T04 / WA2 | RP ID, origin, UP, UV ou action incompatíveis | Desafio server-side, origin/RP exatos, UP+UV requeridos | Origem atacante, wrong RP hash, UV ausente |
| T05 / WA3 | Repetição do desafio e counter zero | Consumo transacional único, políticas de contagem/backup | Replays e desafios vencidos negados até em counter 0 |
| T06 / REC1 | Duas passkeys no mesmo serviço de sincronização | Credenciais distintas + política de domínio de falha independente | Demonstração de IDs distintos; independência física NOT_RUN |
| T07 / REC2 | Perda de todos os fatores | Deny por padrão até cerimônia offline aprovada | Negar reset por email, header, fallback ou ticket público |
| T08 / SES | Cookie roubado/fixado, replay, sessão revogada | Random >=256 bits, HMAC server-side, cookie host-only e rotação | Logout, expiração idle/absolute, troca de credencial, fixation |
| T09 / CSRF | POST cross-site / CORS, Fetch Metadata falso | Origin, Fetch Metadata, CSRF nonce, content type e idempotência | POST sem token ou cross-origin tem 403/denial |
| T10 / PRIV | IDOR ou leak de HTML privado | Verificar Owner antes de qualquer consulta a dados privados | GET sem sessão nega, spy D1 não observa leitura |
| T11 / D1 | Falha em batch ou indisponibilidade D1 | Atomicidade, rollback e ausência de fallback remoto | Injection de falha, nenhuma identidade parcial |
| T12 / SEC | Secret ou credencial gravados em Git/log/artefato | Somente fixtures descartáveis; redaction e scanners | Varredura código, logs, JSON, HTML, artefatos |
| T13 / ENV | Preview herda bindings privilegiados | PR Preview sem origem WebAuthn ou D1/secrets privilegiados | Testes estáticos, ausência de rotas habilitadas |
| T14 / ROL | Restore no D1 remoto errado, perda de writes | Controle de alvo, snapshot/export e simulação em clone | LOCAL restore; remoto NOT_AUTHORIZED |
| T15 / PUB | CMS sintético vira publicação real | Feature gate fechado, direitos e revisão separados | Todas tentativas de publicar negadas |
| T16 / OPS | Exaustão de cotas e DoS | Limites de payload, desafios, taxa, erro genérico | Limites de taxa e indisponibilidade sem bypass |
| T17 / ORIGIN | Domínio Preview ou RP ID falso vinculado a passkey | Origem HTTPS administrativa fixa, aprovação posterior | Origem de PR e host arbitrário rejeitados |
| T18 / SCHEMA | Fixture SQL importada em produção | Migrations separadas, ownership do Integration Steward | Teste de isolamento sem `--remote` nem binding remoto |

## 3. Riscos residuais que NÃO podem ser aceitos como PASS

- **CRITICAL:** desbloquear `src/pages/admin/[...route].js` em build de produção sem GO; usar flag client-side ou herdar sessão LOCAL. STOP.
- **HIGH:** recuperação total não definida. O estado seguro neste estágio é **sem recuperação automática**, jamais `email-only` ou bypass.
- **HIGH:** duas credenciais distintas no teste não provam que pertencem a dispositivos com independência física ou de provedor de sincronização. Exigir decisão e ensaio específicos antes da produção.
- **HIGH:** RP ID/domínio real ainda não selecionado, possibilidade de credencial impossível de recuperar após troca de domínio. Nenhuma origem de Preview é admitida.
- **HIGH:** secrets, IAM, D1 remoto, tabela de migração, rollback e capacidade do Worker não testados em produção. Fixtures LOCAL não comprovam segurança em cloud.
- **MEDIUM:** sessão de 30 minutos idle / 12 horas absoluta é apenas alvo de contrato para LOCAL; limites/rate limit requerem ensaio e revisão na fase de produção.
- **MEDIUM:** cobertura medida do SonarCloud em `main` continua 0,0%; testes GREEN não podem ser descritos como cobertura medida.

## 4. Cenários de recuperação e disaster recovery

**Fator primário perdido:** verificar segundo autenticador independente, exigir UV e desafio exclusivo, revogar sessões e credencial anterior, registrar auditoria sem divulgar assertion. A ação de substituição depende de autorização própria no fluxo de segurança.

**Ambos perdidos:** bloquear. O eventual procedimento offline deverá definir agente que autoriza, verificação independente, custódia, temporizador/espera, alertas, revogação global, prova de unicidade e um registro mínimo de auditoria. Não existe autorização nesta WO para executar este procedimento.

**Banco com falha:** nenhuma autenticação será considerada válida se uma leitura de revogação falhar. Uma implantação futura exige schema versionado, pré-migração export/snapshot, RPO/RTO e recuperação ensaiada em banco de teste. A Cloudflare documenta 7 dias de D1 Time Travel Free (30 dias Paid); restore substitui o estado do alvo. Nenhuma restauração real aqui.

## 5. Evidência / auditoria obrigatória da futura execução

- RED genuíno hospedado antes do produto, demonstrando faltas do novo contrato e não erro do ambiente.
- GREEN Node (WebAuthn criptográfico) + Workerd/D1 LOCAL + Chromium (authenticator virtual, axe, 320/390/768/1366) com testes negativos de todos os gates.
- CI no HEAD exato, SonarCloud zero novos issues/hotspots, Socket ambos relatórios, Gitleaks, PR Assurance e Reviewdog quando aplicáveis. Falhas, skips e quotas devem ser rotulados corretamente.
- Provar `/admin` não-DEV permanece 404, e ausência de rede remota, credenciais reais ou permissões de escrita concedidas ao CI.
- Relatório de testes contém comando, runtime, SHA, resultado e logs sanitizados. `NOT_RUN` não se transforma em `PASS`.
- Esta PR documental **não executa** os testes novos; seus estados permanecem `NOT_RUN`.

**STOP CONDITION:** `HIGH_ASSURANCE_OWNER_ACCESS_NOT_ADMITTED / NO_PRODUCTION_AUTHORITY / NO_CODE_AUTHORITY`.

Referências: https://simplewebauthn.dev/docs/packages/server · https://developers.cloudflare.com/d1/reference/time-travel/ · https://developers.cloudflare.com/workers/previews/configuration/
