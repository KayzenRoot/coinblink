---
name: ecc-ai-regression
description: Testes de regressão contra pontos cegos de IA usando Node Test Runner, Astro e Playwright existentes no CoinBlink.
---
# ECC experimental: AI Regression

Adaptado de affaan-m/ECC@90606c8315ee09cafc303515c5f33024db6b9882 (licença MIT). Projeto CoinBlink governa com `AGENTS.md`.

Quando um bug for corrigido, registre o contrato prévio e proponha um teste que falhe antes da correção; não enfraqueça asserções existentes. Cubra caminhos felizes, erro, autorização, sessões revogadas, dados sintéticos e DOM inerte quando aplicável. Compare comportamentos de código e fluxos locais, não invente equivalência com produção. Use apenas Node Test Runner, Astro e Playwright **já presentes**; exemplos Next.js/Vitest/NextRequest do ECC não se aplicam. Para corrida use barreiras/eventos e deadlines, não apenas sleeps. Se dependência ou navegador estiver ausente, reporte NOT_RUN; sem npm install implícito, rede, secrets, publicação ou bypass.
