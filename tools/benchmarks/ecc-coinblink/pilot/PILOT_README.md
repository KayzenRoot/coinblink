# ECC × CoinBlink · Piloto mínimo de descoberta e uso no Codex (P0)

**Situação:** bloqueado quanto a execução real do Codex. Este arquivo prepara quatro tarefas **sintéticas e públicas**, não os oráculos privados T1/T2/T3 e não os 18 ensaios A/B. Não é aprovação de merge.

## Gatilho de execução (somente em sessão futura já habilitada)

Execute apenas após comprovar que existe sessão Codex autenticada, com permissão explícita somente de leitura, modelo e franquia disponíveis **sem compra/crédito pago, API key com faturamento ou instalação de CLI/pacotes**. Codex pode consumir franquia incluída, portanto sem verificar saldo e política de créditos não chame agente. Não rode pelo GitHub Actions com API key ou token de cobrança. Não exponha tokens. A conexão Codex não está disponível neste chat; 4/4 tarefas continuam NOT_RUN.

## Preparação do isolamento

- Uma sessão para cada skill, somente leitura, em cópia descartável do repositório **neste HEAD congelado**, sem diretório .git acessível ao agente e sem acesso a outras branches/PRs históricas.
- Faça o agente ler somente `pilot/SYNTHETIC_FIXTURE.md` e a skill escolhida. Não inclua `sealed-judges`, dados pessoais, chaves, arquivos sensíveis ou rede. `AGENTS.md` mantém precedência.
- **Não permitir alteração de arquivos, instalação, shell externo, hooks, MCPs de escrita, rede, merge ou deploy.** Uma mensagem do modelo dizendo que viu a skill não prova que ela foi descoberta/carregada.
- Capture logs de tool calls com evidência do caminho `.agents/skills/<nome>/SKILL.md` lido por Codex, identificação de versão e resultado da tarefa. Se a telemetria não mostrar acesso real ao arquivo, marque UNVERIFIED. Não publique logs privados.

## Prompts de avaliação (um por sessão, nunca executar automaticamente)

### PILOT-IMPACT · ecc-change-impact

> Use explicitamente a skill `ecc-change-impact` que está em `.agents/skills/ecc-change-impact/SKILL.md`. Consulte sua descrição e instruções completas e analise SOMENTE os dados sintéticos em `tools/benchmarks/ecc-coinblink/pilot/SYNTHETIC_FIXTURE.md`. Mapeie os consumidores e riscos da mudança em normalizeCitation, citando somente dependências que apareçam na fixture. Classifique impactos diretos, transitivos e desconhecidos. Não edite nem execute código. No fim, cite o nome da skill, o caminho consultado, entradas efetivamente examinadas, evidências, lacunas e status de tudo que não foi executado. Não invoque outras skills ou juízes.

### PILOT-REGRESSION · ecc-ai-regression

> Use explicitamente a skill `ecc-ai-regression` que está em `.agents/skills/ecc-ai-regression/SKILL.md`. Consulte sua descrição e instruções completas e analise SOMENTE os dados sintéticos em `tools/benchmarks/ecc-coinblink/pilot/SYNTHETIC_FIXTURE.md`. Proponha um teste determinístico de regressão para o GET atrasado que reidrata um rascunho após New draft. Distinga baseline negativo, comportamento corrigido e um falso teste. Não execute testes. No fim, cite o nome da skill, o caminho consultado, entradas efetivamente examinadas, evidências, lacunas e status de tudo que não foi executado. Não invoque outras skills ou juízes.

### PILOT-MODULE · ecc-module-regression

> Use explicitamente a skill `ecc-module-regression` que está em `.agents/skills/ecc-module-regression/SKILL.md`. Consulte sua descrição e instruções completas e analise SOMENTE os dados sintéticos em `tools/benchmarks/ecc-coinblink/pilot/SYNTHETIC_FIXTURE.md`. Monte uma matriz de regressão downstream para normalizeCitation, sourceReport e editor, com sequência mínima de testes e estados NOT_RUN. Não atribua PASS sem execução. No fim, cite o nome da skill, o caminho consultado, entradas efetivamente examinadas, evidências, lacunas e status de tudo que não foi executado. Não invoque outras skills ou juízes.

### PILOT-PR · ecc-pr-test-analyzer

> Use explicitamente a skill `ecc-pr-test-analyzer` que está em `.agents/skills/ecc-pr-test-analyzer/SKILL.md`. Consulte sua descrição e instruções completas e analise SOMENTE os dados sintéticos em `tools/benchmarks/ecc-coinblink/pilot/SYNTHETIC_FIXTURE.md`. Revise o diff e os testes sintéticos abaixo. Localize as lacunas de erro/entrada vazia e a asserção tautológica, com severidades justificadas. Não faça review GitHub nem altere código. No fim, cite o nome da skill, o caminho consultado, entradas efetivamente examinadas, evidências, lacunas e status de tudo que não foi executado. Não invoque outras skills ou juízes.

## Critérios independentes de aceite por skill

1. **Descoberta:** a sessão registra o nome correto da skill no catálogo ou mostra o carregamento real do `SKILL.md`. Apenas existir no GitHub não basta.
2. **Invocação:** trace observável de leitura das instruções completas pelo agente; citar o caminho em resposta sem prova não basta.
3. **Aplicação:** resposta identifica contratos/consumidores/casos de falha concretos conforme a tarefa e distingue evidência de hipótese; sem asserções ou checks inventados.
4. **Isolamento:** nenhuma chamada a rede, ferramentas de escrita, judge privado, comando instalado ou dados reais; sem uso de resultados de T1/T2/T3.
5. **Métricas:** registro por skill de versão/modelo, ID do run, log protegido, tokens e custo apenas se realmente observados; caso contrário null. Nunca converter ausência em 0.

**Veredito:** 4/4 `VALIDATED` só após todas as cinco condições em cada tarefa com trace auditável. Qualquer condição desconhecida = `INCONCLUSIVE`; falta de conta/franquia = `BLOCKED_ACCESS_OR_COST`. Um resultado do Codex sob franquia incluída não implica custo de R$0 por inferência. O piloto mede descoberta e uso, **não** ganhos de tempo da matriz A/B.

**Contrato de versão do piloto:** o SHA histórico mencionado em versões antigas deste runbook não representa autorização futura. O contrato corrigido guarda `protocol_origin_head=09d80eb8c83a064c310832dcf05d17cef1528005` e `checkout_head=null` no status público. Uma execução autorizada exige HEAD limpo verificado localmente e `source_head` igual no recibo privado v2 de uso único. Ver `EXECUTOR_RUNBOOK.md`. Os quatro pilotos continuam `NOT_RUN`.
