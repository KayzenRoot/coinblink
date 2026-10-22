---
name: ecc-module-regression
description: Identificar regressões downstream com dependências comprovadas e comandos de testes CoinBlink existentes.
---
# ECC experimental: Module Regression

Adaptado de affaan-m/ECC@90606c8315ee09cafc303515c5f33024db6b9882, licença MIT. `AGENTS.md` CoinBlink tem precedência.

A partir do diff e de imports/chamadas reais, identifique consumidores, testes por módulo e superfícies sensíveis. Exemplos: M02 consome análise de citações M05; visualização de M07 depende da UI local M05. Não invente arestas; marque UNVERIFIED. Execute apenas comandos aprovados no escopo da tarefa. Separe falhas preexistentes de regressões novas e registre exit codes quando realmente observados. Não exigir um `REGRESSION.md` universal, não ativar hooks, MCPs, rede ou agentes extras.
