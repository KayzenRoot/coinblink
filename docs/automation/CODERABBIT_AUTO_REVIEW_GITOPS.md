# CoinBlink · Revisão automática CodeRabbit (candidata GitOps)

## Objetivo

Eliminar a necessidade de solicitar manualmente a mesma auditoria de código em cada PR. A implementação desta proposta é isolada em branch e PR própria, e **não tem efeito permanente na main até um futuro squash merge especificamente autorizado**.

## Configuração proposta

- Arquivo versionado `.coderabbit.yaml` com `inheritance: true`: conserva diretrizes e ferramentas herdadas da configuração da organização, permitindo que apenas as preferências explícitas desta branch tenham prioridade.
- `reviews.auto_review.enabled: true`: analisa novas PRs elegíveis automaticamente.
- `drafts: false`: ignora PRs ainda em desenvolvimento, evitando revisar a cada pequeno ajuste inicial.
- `auto_incremental_review: true`: reavalia commits posteriores na mesma PR, depois de elegível.
- `auto_pause_after_reviewed_commits: 5`: protege a cota ao pausar o review incremental após um lote de commits. Cotas externas e rate limits continuam sendo respeitados.
- `ignore_title_keywords: ["[skip review]"]`: permite exclusão explícita de PRs sem alterar regras de merge.

## Segurança e limitações

- **Review externo automatizado não é APPROVED humano.** GitHub branch protection, os checks Build/SonarCloud/Socket e revisores humanos genuinamente independentes quando necessários continuam vigentes.
- O arquivo do repositório tem precedência sobre configuração comum da organização, **exceto por global overrides** de prioridade superior. Portanto, não é possível afirmar que o serviço aplicou esta configuração sem examinar o comportamento efetivo em uma PR futura ou as configurações resolvidas.
- **Não executar `@coderabbitai review` repetidamente.** Reviews automáticos continuam sujeitos ao plano, quotas e rate limits do fornecedor; ao atingir limites, manter BLOCKED. A configuração não ativa planos pagos, compras ou alterações de billing, e não assegura que exista cota disponível.
- Para não pedir ao usuário monitoramento manual, o CoinBlink PR Radar já acompanha as PRs periodicamente. Ele não precisa emitir comandos duplicados quando o CodeRabbit já iniciou uma revisão.
- A revisão de `kayzenweb3` em #173 foi registrada no GitHub, mas não é independente do proprietário `KayzenRoot`. O estado mergeable=clean não equivale a auditoria humana independente.
- A PR #173 mantém seus quatro arquivos e não é alterada por esta proposta. Não alterar a proteção da main, workflow privilegiado, CodeRabbit organization settings, GEF ou checkpoints.
- Sem squash merge da PR de automação e sem aprovação formal posterior, o CodeRabbit continuará sujeito à configuração vigente, que indicou **Review skipped: automatic reviews are disabled**.
- Não automatizar o merge sem uma autorização futura, específica e baseada no HEAD e nos gates. Nunca fazer deploy, publicação, LIVE, D1 remoto ou contas reais neste fluxo.

## Aceitação futura

1. Revalidar SHA da branch, `main` protegida, diff de dois arquivos, Build, Socket e SonarCloud no HEAD efetivo.
2. Submeter a PR para auditoria técnica substancial e independente, sem tratar bot/skipped/rate limit como aprovação.
3. Após eventual squash merge explicitamente autorizado, validar que uma nova PR não-draft receba revisão automática de forma efetiva, sem duplicação, e que PRs draft continuem sem disparos.
4. Se um global override impedir a alteração, registrar bloqueio e planejar uma mudança de configuração separada. Nunca forçar ou simular revisão.
