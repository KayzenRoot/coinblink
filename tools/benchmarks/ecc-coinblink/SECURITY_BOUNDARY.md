# Fronteira de segurança: GitHub público não é cofre de juiz

Este repositório é PUBLIC. Os oráculos T1/T2/T3 e o manifesto com seus testes de respostas foram deliberadamente omitidos. Publicar critérios ocultos na PR contaminaria o experimento e anularia a independência. O proprietário conserva o arquivo `ECC_CoinBlink_Sealed_Judges_REVISADO_2026-10-22.zip` fora do checkout do agente; antes de qualquer execução, verificar integridade SHA-256 do ZIP e selos, acesso físico, permissões e isolamento do processo.

Não há execução automática de benchmarks nem GitHub Actions adicionadas. Não importar ECC `.codex/config.toml`, `hooks/codex-hooks.json`, servidores MCP nem install scripts. Scripts do operador são material educativo pré-auditado estaticamente, e NÃO estão validados no Windows. Nunca rodar como efeito colateral de PR, CI ou carregamento de skill.

Limites: scripts/prompt público não impedem o agente de procurar PR histórica se tiver acesso à rede; execução futura só é válida com isolamento efetivo da rede e do filesystem. `git archive` não contém dependências; não instalar automaticamente. Sem dados reais, sem secrets, sem publicação, sem deploy, sem merge sem autorização do Owner.

Status: `INTEGRATION_PROPOSED`, `BENCHMARK_READY=false`, `RUNS_COMPLETED=0`.
