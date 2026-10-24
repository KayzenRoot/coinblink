# Fronteira de segurança: GitHub público não é cofre de juiz

Este repositório é PUBLIC. Os oráculos T1/T2/T3 e o manifesto com seus testes de respostas foram deliberadamente omitidos. Publicar critérios ocultos na PR contaminaria o experimento e anularia a independência. O proprietário conserva o arquivo `ECC_CoinBlink_Sealed_Judges_REVISADO_2026-10-22.zip` fora do checkout do agente; antes de qualquer execução, verificar integridade SHA-256 do ZIP e selos, acesso físico, permissões e isolamento do processo.

Não há execução automática de benchmarks ou Codex. Há um workflow de validação **sintética** ECC em GitHub Actions, com testes Python no Ubuntu/Windows e smoke PowerShell no Windows, aprovado no HEAD auditado. Ele não executa as quatro skills no Codex, não calibra juízes e não valida um ambiente Windows real do proprietário. Não importar ECC `.codex/config.toml`, `hooks/codex-hooks.json`, servidores MCP nem install scripts. Nunca rodar como efeito colateral de PR, CI ou carregamento de skill.

Limites: scripts/prompt público não impedem o agente de procurar PR histórica se tiver acesso à rede; execução futura só é válida com isolamento efetivo da rede e do filesystem. `git archive` não contém dependências; não instalar automaticamente. Sem dados reais, sem secrets, sem publicação, sem deploy, sem merge sem autorização do Owner.

Status: `INTEGRATION_PROPOSED`, `BENCHMARK_READY=false`, `RUNS_COMPLETED=0`.

**Registro histórico e estado atual:** o SonarCloud inicialmente falhou na PR #209 devido a achados de Path Traversal no coletor. Foram corrigidos e revalidados; no HEAD `1679521d30c8de5d2acf0302d4440d927f589f95`, o Quality Gate passou com **0 novos issues e 0 Security Hotspots**. A verificação de nomes TAR e a recusa de links antes da extração não constituem sandbox para arquivos não confiáveis. Nunca permitir que o operador receba commit-base arbitrário nem TARs de terceiros. Se o HEAD avançar, o resultado do Sonar deve ser reconsultado.
