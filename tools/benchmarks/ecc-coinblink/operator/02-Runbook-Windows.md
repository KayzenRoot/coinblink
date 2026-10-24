# Operação futura Windows: preparação, não execução

Este guia não foi executado no Windows. O GitHub contém o código e a matriz, mas NÃO os juízes privados, checkouts históricos, dependências npm, Chromium ou registros de resultados.

1. Baixar ou exportar este subdiretório para uma pasta externa ao clone CoinBlink, e garantir isolamento físico dos juízes. Não rodar scripts de dentro do checkout original.
2. Confirmar Git, PowerShell, tar e todos os commits históricos existentes localmente sem fetch.
3. Apenas após autorização de preparo, usar operador 01 para gerar snapshots git archive, sem pasta .git. Em falta de objeto, STOP.
4. Apenas após autorização específica do ensaio, preparar run A ou B com operador 02. A não recebe skills ECC; B recebe só quatro skills adaptadas.
5. NÃO executar Codex, Node, npm, Playwright, testes ou instaladores sem nova aprovação e provas de ambiente. D1/WebAuthn apenas com fixtures sintéticas. A sandbox workspace-write não garante ausência de rede, hooks ou MCPs.
6. Em sessão futura autorizada, registrar JSONL por run; script 03 é apenas leitor de logs, não executa agentes. Custo desconhecido = null, nunca R$0 inferido.
7. Calibrar juízes fora do workspace, antes do primeiro A/B: baseline negativo, referência positiva, mutantes e verificação dos selos SHA-256. Não enviar suas fontes a agentes.
8. Para rollback seguro, quarentena de uma cópia descartável por operador 04 e aprovação explícita. Nunca resetar/alterar main ou qualquer branch.

Medidas de sucesso e 18 linhas NOT_RUN em matrix/. Publicar juiz no repositório público, usar patches históricos nos agentes ou dar acesso à rede invalida a comparação.


## Captura de métricas com caminhos fixos (Correction Delta SonarCloud PR #209)

O coletor não aceita mais `--jsonl` nem `--out` fornecidos por IA. Após preparar e, futuramente, executar um run **autorizado**, o operador coloca seu log pré-existente em `local-artifacts/runs/T1-A-r1/codex.jsonl` dentro do pacote offline exportado **fora de qualquer checkout Git**, e chama somente:

```powershell
python .\operator\03-CaptureMetrics.py --run-id T1-A-r1
```

Os 18 run IDs válidos vão de `T1-A-r1` até `T3-B-r3`, conforme a matriz. O arquivo de saída é sempre `local-artifacts/runs/<run-id>/metrics/codex-usage.json`, criado exclusivamente se ainda não existir. A origem `RUN_ORIGIN.json` deve coincidir, caminhos com links simbólicos/junctions são recusados, e o JSONL fica limitado a 32 MiB. Nunca informe nomes de arquivos livres ao coletor. Este trecho é **instrução futura**, não registro de execução.

**Estado:** o benchmark permanece NOT_RUN; o script não foi executado aqui. A validação funcional Windows continua pendente.
