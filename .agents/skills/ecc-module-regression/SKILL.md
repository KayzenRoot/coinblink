---
name: ecc-module-regression
description: Mapeie dependências reais entre módulos CoinBlink e planeje regressões downstream executáveis sem adicionar gates universais.
---
# ECC experimental · Module Regression

Baseado na metodologia de affaan-m/ECC@90606c8315ee09cafc303515c5f33024db6b9882, MIT. AGENTS.md e os testes do CoinBlink são a fonte de autoridade para decisões de desenvolvimento.

## Quando ativar
Mudanças em exports, schemas, validadores, armazenamento, auth, rotas compartilhadas, componentes UI e fronteiras M01-M07. Não é necessária para mudanças textuais sem consumidores demonstrados.

## Protocolo
1. Parta de um diff/HEAD e registre os módulos diretamente editados.
2. Rastreie consumidores concretos por imports, chamadas e contratos; cite arquivo e linha. Exemplo histórico a verificar: M02 consome análise de citações M05 e M07 pode consumir UI local de M05.
3. Faça o grafo impactado: módulo alterado -> consumidor -> interface/fluxo -> teste. Não invente arestas nem suponha que todo teste de módulo é relevante.
4. Escolha uma suíte mínima focada e expanda somente se um contrato compartilhado atingir outros módulos. Inclua casos negativos e checagens de segurança onde houver superfície sensível.
5. Registre comando **realmente executado**, HEAD, ambiente, exit code, PASS/FAIL; ausência de execução é NOT_RUN. Distingua falha preexistente de regressão introduzida com evidência.
6. Se o próprio benchmark ECC ainda não foi autorizado, não execute seus 18 runs nem abra juízes privados. É válido executar somente os testes de contrato sintéticos expressamente autorizados.

## Saída esperada
Mapa de consumidores acompanhado de matriz módulo | razão comprovada | testes | resultado | risco residual. Evidência deve poder ser refeita por outro operador sem usar dados reais.

## Limites
Nenhum REGRESSION.md obrigatório em todo PR; nenhum hook, MCP, instalador ou subagente implícito. Não faça merge, deploy nem publique material de juiz.
