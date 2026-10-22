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
