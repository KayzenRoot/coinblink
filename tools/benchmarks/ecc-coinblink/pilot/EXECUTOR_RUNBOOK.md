# Executor Codex · P0 · quatro skills selecionadas (fail-closed)

Este executor **não foi executado com Codex**. O arquivo `PrepareCodexPilot.py` prepara apenas um plano em sua operação padrão e falha sem acesso verificado. Seu `--execute` está documentado para um futuro operador autorizado. **Não rodar pelo GitHub Actions nem habilitar automaticamente.** A CI roda somente os testes sintéticos de gate, nunca o modelo.

## Utilização segura, sem agente

Com Python **já disponível**, dentro de uma cópia confiável do CoinBlink (nenhuma instalação):

```powershell
python tools/benchmarks/ecc-coinblink/pilot/PrepareCodexPilot.py --skill ecc-change-impact
```

Também aceita `ecc-ai-regression`, `ecc-module-regression` e `ecc-pr-test-analyzer`. O padrão imprime `PLAN_ONLY_NO_AGENT` e informações de bloqueio. **Nenhuma conta Codex, pacote, teste A/B, oráculo ou API é acionada.**

## Gate antes de sequer propor execução

**Não execute `--execute` agora.** Em futura sessão explicitamente autorizada, a pessoa responsável deverá primeiro verificar no painel de uso do próprio Codex: login com ChatGPT, franquia incluída disponível, ausência de fallback para créditos pagos e nenhuma API key faturada. Consulte [Help Center](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan). As interfaces e cobranças podem mudar. **Nenhum parâmetro da CLI certifica sozinho o custo zero.** Se o produto não permitir desativar ou certificar o fallback pago, este gate permanece BLOQUEADO e não deve ser contornado com um campo JSON afirmativo.

Além disso, requer ambiente externo isolado, sem arquivos reais, segredos, rede arbitrária, hooks nem MCPs, Codex CLI previamente instalado (não instalar), e autorização específica para **esta skill e este HEAD**. O sandbox `read-only` do Codex não impede acesso de leitura a outros arquivos do host: o isolamento por sistema operacional/VM deve ser verificado de forma independente.

A confirmação manual privada usa **arquivo fora do repositório público** no caminho de usuário `~/.coinblink-ecc-pilot/approval.json`. A cópia `APPROVAL_TEMPLATE.json` incluída aqui tem todos os campos como `false`, portanto é intencionalmente não autorizadora. A confirmação só vale por 15 minutos e deve identificar HEAD, skill, referência local do painel e modo `included_allowance_only`. Autodeclarações **não são comprovantes técnicos** e nunca devem ser preenchidas falsamente.

Para execução futura, há ainda confirmação expressa `--execute --confirm INCLUDED_QUOTA_ONLY`. A aplicação rejeita falta de CLI, ausência de login ChatGPT, variáveis de API com faturamento, execução em CI, quota não comprovada e recebimento de usuário com parâmetros desconhecidos. Ela cria um workspace temporário com **apenas a fixture sintética e quatro skills**, sem histórico `.git`. Os logs ficam em diretório temporário privado e devem ser revisados sem publicar dados de sessão.

### Segurança operacional

O executor usa `codex exec --json --ephemeral --skip-git-repo-check --ignore-user-config --ignore-rules --sandbox read-only --ask-for-approval never`, sem chaves de API e passando o prompt por stdin. Essas opções existem na documentação da [CLI](https://learn.chatgpt.com/docs/cli/reference), mas seu comportamento depende da versão efetivamente instalada. Mesmo assim, **não garantem isolamento completo do filesystem ou custo zero**: é indispensável uma VM/contêiner isolado e prova externa de franquia. O script estabelece timeout de 120 s, mas isso não substitui um limite de tokens/cobrança garantido pelo provedor.

### Estado do experimento

`PILOT_STATUS.json` permanece 4/4 `NOT_RUN` e `BLOCKED_ACCESS_OR_COST_UNVERIFIED`; a matriz T1/T2/T3 mantém 18/18 `NOT_RUN`; todos os oráculos sigilosos ficam fora do GitHub. A prova de instalação não é evidência de descoberta real pelo modelo. Nenhum merge ou deploy é autorizado.
