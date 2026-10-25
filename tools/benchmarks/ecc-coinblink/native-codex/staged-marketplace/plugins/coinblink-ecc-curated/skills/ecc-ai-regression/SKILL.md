---
name: ecc-ai-regression
description: Planeje testes de regressão independentes para correções geradas por IA no CoinBlink, usando Node Test Runner, Astro e Playwright existentes.
---
# ECC experimental · AI Regression Testing

Adaptação de princípios de affaan-m/ECC@90606c8315ee09cafc303515c5f33024db6b9882, licença MIT. O AGENTS.md do CoinBlink prevalece. Exemplos Next.js, Vitest, NextRequest e /bug-check do ECC upstream NÃO são comandos deste projeto.

## Quando ativar
Após um bug reproduzido, refatoração que deve preservar contrato ou correção onde um teste criado pelo próprio implementador pode reforçar um falso positivo. Use proporcionalmente ao impacto.

## Protocolo
1. Congele comportamento observável anterior, entradas sintéticas e asserções essenciais. Não copie patches de PRs históricas como resposta de benchmark.
2. Escreva um caso reproduzível capaz de falhar no baseline defeituoso, quando permitido. Não enfraqueça testes existentes nem adicione assertions tautológicas.
3. Separe happy path, entradas inválidas, concorrência, sessões revogadas/401, CSRF/Origin, dados locais EN/PT e conteúdo HTML inerte quando aplicáveis.
4. Para races de browser, controle ordem das respostas por barreiras ou eventos determinísticos com timeout. Evite aprovação baseada apenas em sleeps.
5. Reutilize Node Test Runner e Playwright existentes. Se navegador, fixture ou licença estiverem indisponíveis, marque NOT_RUN e não simule PASS.
6. Compare baseline negativo, referência positiva e mutantes em juiz **independente e privado**, se o experimento for autorizado. O implementador não deve acessar esses oráculos.

## Saída esperada
Para cada caso: descrição da regressão, mudança protegida, teste, saída real, exit code e estado PASS/FAIL/NOT_RUN. Qualquer conclusão sobre cobertura exige medição real. Escopo A/B e 18 linhas NOT_RUN devem permanecer imutáveis antes do ensaio.

## Limites
Sem instalar dependências automaticamente, acesso externo, execução de agentes, juízes privados, dados LIVE, pagamentos, publicação, merge ou deploy por implicação.
