# Experimento A/B pré-registrado, ainda não executado

Três tarefas × dois braços × três repetições = 18 runs. Ordem AB, BA, AB por tarefa. A = Codex canônico CoinBlink; B = mesmo Codex, quatro skills adaptadas adicionadas ao workspace descartável. Ambos têm exatamente o mesmo commit-base, Node/browser, modelo, effort, rede bloqueada, sem hooks extras, MCPs extras ou acesso a material de juiz.

Métricas: seconds_active, seconds_wall, seconds_ci_wait; tokens_in/out/cache/reasoning por JSONL quando realmente observados; cost_usd só com cobrança verificável, senão null; unique_errors por causa raiz; correction_cycles por correção após julgamento; first_pass; regressões e violações de segurança. Não inferir tempos pela abertura de PR ou uso de tokens quando faltam.

Todos os resultados são NOT_RUN. Juízes NÃO calibrados. Juiz T1 deve reprovar no-op; T2 deve reprovar corrida reproduzida na base e aprovar implementação histórica conhecida; T3 exige Node + navegador/axe. Baseline positivo/negativo e mutantes independentes antes de registrar ganhos. Meta exploratória: >=15% menos tempo sem piora de segurança/qualidade/custo OU >=20% menos correções com resto comparável. Três repetições por caso não comprovam significância robusta.

IMPORTANTÍSSIMO: arquivos de `sealed-judges` são deliberadamente EXTERNOS ao GitHub público. Seus SHA-256 são registrados no pacote externo; não publicar códigos, fixtures secretos ou expected outputs no repo. 
