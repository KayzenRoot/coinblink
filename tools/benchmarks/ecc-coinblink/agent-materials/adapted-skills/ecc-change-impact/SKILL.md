---
name: ecc-change-impact
description: Analisar impacto baseado em imports reais para mudanças CoinBlink, sem novos hooks ou serviços externos.
---
# ECC experimental: Change Impact

Adaptado de affaan-m/ECC@90606c8315ee09cafc303515c5f33024db6b9882 (licença MIT). Não é plugin oficial. Respeitar CoinBlink `AGENTS.md`; não impor novos gates universais.

Quando mudanças forem cross-module, de autenticação, contratos, persistência ou segurança, rastreie entrypoints, imports, chamadas, consumidores, compatibilidade, testes e riscos antes da edição. Marque relações desconhecidas UNVERIFIED. Para mudanças pequenas, reporte impacto resumido sem criar documentos extras. Depois de implementar, compare o diff real com escopo e caminhos declarados; evidência de comando não é prova de correção. Não instale nada nem execute comandos sem autoridade da tarefa; nenhuma publicação, CI write ou merge implícito.
