# ECC × CoinBlink · Instalação experimental via GitHub (sem uso do Windows)

Integração em branch isolada, draft PR, originada na main `729fe0910abdb350528d539e0498dbbc30d703de`, ECC pinado em `90606c8315ee09cafc303515c5f33024db6b9882`.

## Conteúdo
- `.agents/skills/ecc-*/SKILL.md`: quatro capacidades selecionadas para Codex, **adaptadas** aos testes Astro/Node/Playwright.
- `agent-materials/tasks/T1.md`, T2 e T3: briefs comuns para os braços A/B, sobre três SHAs históricos.
- `snapshot-descriptors/`: descritores dos commits e árvores históricas, ainda **NOT_MATERIALIZED**.
- `matrix/AB_18_executions.csv`: todas as 18 observações **NOT_RUN**.
- `matrix/measurement_contract.md` e `SECURITY_BOUNDARY.md`: métricas, regras e limitações.

## Operação

O commit não instala pacotes npm, não baixa ECC inteiro, não habilita hooks, MCPs ou multiagentes, não altera código de produto, não cria execução automática do benchmark, não roda Codex e não gasta. A existência de skills na branch permite sua descoberta pelo Codex se estiver usando **essa branch**. Não é autorização para ativação em produção ou merge.

**Não há checkouts históricos completos, dependências, navegadores ou oráculos no GitHub.** Para o piloto futuro, materializar snapshots fora do clone, via `git archive` de um clone que já contenha as três bases; exigir um ambiente com dependências existentes; separar juízes em ambiente de avaliação restrito; validar baseline negativo e positivo antes de medir. Não iniciar nenhuma execução sem autorização específica.

**Documentos orientadores:** `AGENTS.md`, `docs/BUILD_FIRST.md` e `docs/CHAT_WORKFLOW_AND_HANDOFF.md` da branch são prioritários. Skills não criam novos gates. Nenhuma aprovação ou merge automáticos.

Pacote operacional offline completo e selado foi produzido na conversa em 22/10/2026; seu ZIP é externo e não é republicado aqui, para manter juízes privados. O repositório armazena componentes públicos que são seguros de versionar.

## Revisão de segurança da PR #209

Na auditoria de 22/10/2026, o check SonarCloud da PR no HEAD inicial 4cf2ca8de747c1ad89c0de8f32967c807e1264b8 falhou por **nota C de segurança no código novo**, segundo comentário do bot (critério mínimo A). As regras/linhas específicas não foram disponibilizadas pela consulta, portanto a causa individual está **UNVERIFIED**, não atribuída a uma ferramenta por suposição. Foram endurecidas verificações operacionais: diretório-raiz Windows, bloqueio de execução do pacote sob Git, rejeição pré-extração de symlinks/submodules e caminhos perigosos no TAR, inventário fechado de skills do braço B. Isso não comprova que o Sonar foi corrigido. O benchmark e os juízes seguem NOT_RUN/UNVALIDATED. Aguardar análise em novo HEAD e fazer triagem dos findings efetivos antes de afirmar READY.


### Correction Delta sobre o coletor (PR #209)

O SonarCloud identificou três achados High de **Path Traversal via faulty LLM-supplied CLI arguments** em `operator/03-CaptureMetrics.py`, evidenciados pelo proprietário com captura de tela em 22/10/2026. A interface do coletor foi reduzida ao seletor `--run-id` de 18 valores enumerados; caminhos de leitura e escrita são agora gerados exclusivamente pelo layout conhecido do pacote externo, com bloqueio de checkout Git, verificação de `RUN_ORIGIN.json`, links simbólicos/junctions, limite de arquivo e escrita exclusiva. O coletor e o pacote ECC foram testados **somente com dados sintéticos** no Ubuntu/Windows; o SonarCloud passou no HEAD `1679521d30c8de5d2acf0302d4440d927f589f95` com zero novos issues. Os quatro pilotos Codex e os 18 ensaios A/B permanecem **NOT_RUN**.

## Automated synthetic validation, not the A/B benchmark

The separate `.github/workflows/ecc-offline-validation.yml` performs offline, standard-library-only contract checks on Ubuntu and isolated synthetic PowerShell operator smoke checks on Windows. It never launches Codex, accesses sealed judges, downloads dependencies, pulls historical snapshot commits, publishes artifacts, or writes to main. It uses ephemeral GitHub-hosted public-repo runners and may execute automatically on PR updates. Unit checks **do not establish** agent efficacy, Windows workstation compatibility, code coverage percentage for production, or calibrated judge status. The 18 comparative rows remain `NOT_RUN` and the private oracles remain outside the public repository. Do not claim "ECC fully working" solely from synthetic CI.

### Revisão de segurança final do executor v2

A autenticação `codex login status` e o processo futuro `codex exec` agora recebem o **mesmo ambiente filtrado**, evitando verificar um login e executar com outra origem de credenciais. O executor recusa variáveis de chaves API, `CODEX_ACCESS_TOKEN`, credenciais federadas e endpoints Azure; o status final diferencia exit code 0 de falha, timeout e erro de processo. Testes sintéticos verificam estes bloqueios, sem iniciar Codex. O isolamento de filesystem/rede deve ser imposto e auditado pelo operador **fora do Python**, e não pode ser inferido das opções `read-only` ou `--ignore-user-config`. O status público permanece bloqueado até verificação externa de franquia sem créditos pagos e de sessão autenticada. Links oficiais: https://learn.chatgpt.com/docs/developer-commands?surface=cli e https://learn.chatgpt.com/docs/auth.

## Python coverage in synthetic CI (stdlib only)

`validation/measure_python_coverage.py` runs the ECC unittest suite in a temporary directory with a `sitecustomize` tracer active in the parent and child Python processes. This measures executable-line coverage for the **pilot executor** and the **collector**, including isolated collector CLI subprocesses; reports exact numerators/denominators and the executable-line rate in the Ubuntu ECC job. No `coverage.py` dependency or uploads to external services. The gate requires a conservative minimum per source file (50% collector; 30% pilot). These percentages are **measured for the synthetic paths only**, not the 18 A/B tests or agent efficacy; SonarCloud does not automatically ingest this stdlib report, so do not represent it as Sonar coverage. Three additional negative collector tests verify malformed origin metadata, oversized logs and invalid token usage values. The workflow keeps all execution gates blocked.

## CodeQL experimental no GitHub Actions público

A PR #209 executa `.github/workflows/ecc-codeql-experimental.yml` **somente quando `pull_request.number == 209`**, com CodeQL oficial v4.39.0 fixado no commit `6f2ac81f5cd81fe351a197ba0b00d91d03cd2aee`, linguagens Python e JavaScript/TypeScript, consulta `security-and-quality` e sem novo `npm ci` ou instalação no projeto. O CodeQL baixa seu bundle de análise somente no runner público efêmero, gratuitamente para este repositório público; requer `security-events: write` para enviar resultados ao code scanning do GitHub. Isto **não** ativa por si o CodeQL em todas as branches ou substitui a configuração padrão da `main`. Se o upload for bloqueado por configuração do GitHub, marcar CodeQL como não comprovado e não mexer nas configurações de segurança sem autorização. Não há execução de Codex ou de benchmarks.

### CodeQL sem token de escrita (scope obrigatório do CoinBlink)

A primeira tentativa de `github/codeql-action` exigia `security-events: write` e foi **bloqueada corretamente pelo PR Assurance / scope**, que não pode ser enfraquecido. O workflow experimental passou a usar token `contents: read`, `upload: never` e `upload-database: false`, gerando apenas SARIF no runner efêmero para relatório resumido, sem enviar achados ao Code Scanning. Se o motor não conseguir produzir o SARIF nesse modo, tratar a análise como **não comprovada**, preservando o gate de escopo e as demais validações.
