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
