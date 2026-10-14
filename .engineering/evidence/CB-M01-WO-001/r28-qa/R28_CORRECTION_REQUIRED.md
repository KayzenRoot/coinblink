# R28 — estabilidade dos fixtures e QA cross-browser

**Resultado: `CORRECTION REQUIRED`**

**PR:** [#58](https://github.com/KayzenRoot/coinblink/pull/58)

**HEAD testado:** `0235517ed43e0794d7e0d9e3fd4bc88ea054cd48`

**Base:** `07f31d8e3e7b7b7d3534274199dfc0e4e07a2f1c`

**Work Order:** `CB-M01-WO-001`

**Autorização de merge:** `authorizedToMerge=false`

## Resultado local reproduzível

No Windows 11 Home Single Language, Ryzen 5 2500U, 8 processadores lógicos e Node.js `v22.23.3` com npm `10.9.9`, executei `npm test` sem preloader de diagnóstico e sem `NODE_OPTIONS`. O comando foi iniciado pelo Node 22 fixado localmente. No HEAD acima, terminou com código `1` após `204,03 s`: **190 de 192 testes passaram, 2 falharam, 0 foram ignorados**.

Como `npm test` encadeia `test:unit && build && test:e2e`, a falha dos unitários interrompeu o comando. Build e E2E **não foram executados nesta rodada R28**.

### Falhas observadas

1. `test/modules/CB-M01/visual-check.mjs` (teste 27), duração `58.329,942 ms`: o servidor Astro registrou `ready in 16445 ms` e anunciou `http://127.0.0.1:51648/`, mas o pedido de prontidão terminou com `readiness request exceeded the remaining deadline`. Não foi observado HTTP 200 para essa fixture. O coletor de recursos não registrou o listener `51648` em nenhuma amostra; registrou outro listener da fixture em `51645`. Isso descarta a hipótese simples de que o Astro nunca anunciou prontidão, mas **não prova** corrida de porta, falha de processo ou causa de rede.
2. `test/cloudflare-preview-workflow.test.mjs:91` (teste 39), duração `15.904,289 ms`: `spawnSync` expirou (`ETIMEDOUT`) ao executar a ajuda do Wrangler 4.149.0 pelo Node 22. A chamada está fora dos arquivos autorizados da WO M01 e requer decisão do Integration Steward ou uma Work Order própria.

## Diagnóstico controlado disponível

| Ensaio | Modo | Resultado |
|---|---|---|
| `npm test` R28 | Padrão, sem instrumentação | 190/192; as duas falhas acima |
| `npm test` diagnóstico | Node 22 com preloader de observação | 189/192; três falhas, incluindo readiness M01 e dois timeouts de testes de governança |
| `test:unit -- --test-concurrency=1` | Serial, com preloader | 191/192; Wrangler `spawnSync ETIMEDOUT`; testes visuais M01 passaram nessa rodada |
| `visual-check` isolado | Com preloader | Passou; primeiro HTTP 200 em cerca de 9,17 s |
| `integrated-visual-check` isolado | Com preloader | Passou; primeiro HTTP 200 em cerca de 2,62 s |

As execuções instrumentadas mudam a observação do processo e são evidência diagnóstica, não substituem o resultado padrão. Os ensaios isolados sugerem que a falha M01 depende do modo agregado, mas não identificam uma causa. Não há evidência suficiente para atribuir o problema somente à carga da máquina: durante a rodada padrão, o conjunto de processos filho chegou a `1,69 GB` de working set, `25` processos e pico estimado de CPU do conjunto de `24%` dos 8 processadores lógicos. A memória física livre caiu de `5,29 GB` para `4,06 GB`. Essa medição não representa a utilização total da máquina e não elimina contenção de escalonamento.

O preloader observou sockets loopback em portas efêmeras. A amostragem de um segundo não observou o listener da fixture que falhou (`51648`); portanto, não se pode concluir que houve colisão nem que o porto ficou continuamente livre.

## Escopo que parou pelo STOP do R28

Após a falha limpa agregada, não executei novas tentativas, E2E, build, lint, typecheck, audit, capturas R28, perfis frios nem medição de dois ciclos da animação. Isso respeita o STOP do plano. Chromium e Edge estão disponíveis, ambos usam Blink; Firefox/Gecko e WebKit não estão disponíveis no cache local. Não instalei navegadores. O R28 não reivindica cobertura cross-browser, zoom real, acessibilidade ou desempenho.

As 6 verificações hospedadas conhecidas pertencem ao HEAD anterior `0235517...`; elas não corrigem nem anulam as falhas locais. O estado exato dessas verificações para um HEAD de evidências dependerá da publicação deste registro.

## Hipóteses e próximo passo mínimo

- **Atraso simples no início do servidor:** parcialmente descartado; Astro anunciou prontidão em `16,445 s`, mas o probe não recebeu status antes do prazo.
- **Corrida de readiness, socket ou ciclo de vida do processo:** ainda possível; sem timestamp do primeiro HTTP 200 e sem listener `51648` observado, a causa permanece indeterminada.
- **Pressão de memória como causa única:** sem suporte nesta rodada; havia ao menos `4,06 GB` livres nas amostras. A carga total da máquina não foi medida, então contenção de CPU continua possível.
- **Timeout do Wrangler:** reproduzido como `ETIMEDOUT` fora do escopo da WO. Não aumentei timeouts nem modifiquei o teste.

Próximo passo de menor escopo: em trabalho autorizado do M01, instrumentar somente o ciclo da fixture e o pedido de prontidão para registrar PID, bind/listen, início/fim do probe e primeiro status HTTP; tratar o timeout do Wrangler separadamente com o Integration Steward. Não alterar M00, o timeout global, assertions, skips, GEF ou regras para obter um PASS.

## Evidências e integridade

- [Saída TAP completa sanitizada](npm-test.stdout.sanitized.log); paths locais foram substituídos por marcadores, sem remover linhas de teste.
- `npm-test.stderr.log` está vazio.
- SHA-256 do stdout bruto local: `63D7BF359896C6050F2D2F0A62E54AAB0B4F6E7B5A31E6FFE6CFFD117258398C`.
- SHA-256 do stderr bruto vazio: `E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855`.
- SHA-256 das amostras brutas de recursos locais (não publicadas por conterem PIDs): `1873A9D03A4BD3A615D88FC80E10389DF5838C29DEC676A6B5943D644C4E8537`.
- SHA-256 do log TAP sanitizado publicado: `B53436815C0ADB83CFD587F75091B098059E99082227870573D6656DF5A20F19`.
- Um scan de padrões comuns de credenciais no log sanitizado não encontrou correspondências.
- R27 foi preservado. Nenhum código de produto, M00, checkpoint, ruleset ou critério de aprovação foi alterado. M01 permanece `ADMITTED / NOT DONE`.

**Conclusão:** `CORRECTION REQUIRED`. A suíte agregada local continua instável; a causa do timeout de readiness M01 não foi provada. Sem autorização para merge ou publicação comercial.
