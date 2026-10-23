# ECC × CoinBlink · Instalação experimental via GitHub (sem uso do Windows)

Integração em branch isolada, draft PR, originada na main `729fe0910abdb350528d539e0498dbbc30d703de`, ECC pinado em `90606c8315ee09cafc303515c5f33024db6b9882`.

## Conteúdo
- `.agents/skills/ecc-*/SKILL.md`: quatro capacidades selecionadas para Codex, **adaptadas** aos testes Astro/Node/Playwright.
- `agent-materials/tasks/T1.md`, T2 e T3: briefs comuns para os braços A/B, sobre três SHAs históricos.
- `snapshot-descriptors/`: descritores dos commits e árvores históricas, ainda **NOT_MATERIALIZED**.
- `matrix/AB_18_executions.csv`: todas as 18 observações **NOT_RUN**.
- `matrix/measurement_contract.md` e `SECURITY_BOUNDARY.md`: métricas, regras e limitações.

## Operação

O commit não instala pacotes npm, não baixa ECC inteiro, não habilita hooks, MCPs ou multiagentes, não altera código de produto, não cria CI, não roda Codex e não gasta. A existência de skills na branch permite sua descoberta pelo Codex se estiver usando **essa branch**. Não é autorização para ativação em produção ou merge.

**Não há checkouts históricos completos, dependências, navegadores ou oráculos no GitHub.** Para o piloto futuro, materializar snapshots fora do clone, via `git archive` de um clone que já contenha as três bases; exigir um ambiente com dependências existentes; separar juízes em ambiente de avaliação restrito; validar baseline negativo e positivo antes de medir. Não iniciar nenhuma execução sem autorização específica.

**Documentos orientadores:** `AGENTS.md`, `docs/BUILD_FIRST.md` e `docs/CHAT_WORKFLOW_AND_HANDOFF.md` da branch são prioritários. Skills não criam novos gates. Nenhuma aprovação ou merge automáticos.

Pacote operacional offline completo e selado foi produzido na conversa em 22/10/2026; seu ZIP é externo e não é republicado aqui, para manter juízes privados. O repositório armazena componentes públicos que são seguros de versionar.

## Revisão de segurança da PR #209

Na auditoria de 22/10/2026, o check SonarCloud da PR no HEAD inicial 4cf2ca8de747c1ad89c0de8f32967c807e1264b8 falhou por **nota C de segurança no código novo**, segundo comentário do bot (critério mínimo A). As regras/linhas específicas não foram disponibilizadas pela consulta, portanto a causa individual está **UNVERIFIED**, não atribuída a uma ferramenta por suposição. Foram endurecidas verificações operacionais: diretório-raiz Windows, bloqueio de execução do pacote sob Git, rejeição pré-extração de symlinks/submodules e caminhos perigosos no TAR, inventário fechado de skills do braço B. Isso não comprova que o Sonar foi corrigido. O benchmark e os juízes seguem NOT_RUN/UNVALIDATED. Aguardar análise em novo HEAD e fazer triagem dos findings efetivos antes de afirmar READY.


### Correction Delta sobre o coletor (PR #209)

O SonarCloud identificou três achados High de **Path Traversal via faulty LLM-supplied CLI arguments** em `operator/03-CaptureMetrics.py`, evidenciados pelo proprietário com captura de tela em 22/10/2026. A interface do coletor foi reduzida ao seletor `--run-id` de 18 valores enumerados; caminhos de leitura e escrita são agora gerados exclusivamente pelo layout conhecido do pacote externo, com bloqueio de checkout Git, verificação de `RUN_ORIGIN.json`, links simbólicos/junctions, limite de arquivo e escrita exclusiva. O novo código **não foi executado**; o sucesso definitivo requer nova análise SonarCloud no HEAD e evidência de validação autorizada posteriormente.
