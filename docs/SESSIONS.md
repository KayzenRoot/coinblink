# Sessões de trabalho · CoinBlink

Cada sessão trata **um assunto** e termina com o estado registrado em
`docs/STATUS.md`. Não misture assuntos na mesma sessão.

## Como abrir uma sessão

1. Abra uma sessão nova.
2. Primeira mensagem: o prompt da sessão abaixo (copie a linha inteira).
3. O agente lê `docs/STATUS.md`, executa, mede e para ao entregar.
4. Ao final, atualize `docs/STATUS.md` e a memória do projeto.

## S1 · Design da home (pendente)

> Leia `docs/STATUS.md`. Execute só o item 1 (design da home). Antes de mexer,
> meça a geometria com `getBoundingClientRect` em 1536px, 1152px e 692px e me
> mostre os números. Corrija um bloco por vez, com o mesmo deploy, e só capture
> tela no fim para conferência.

Escopo: proporção radar/lexicon/promo, escala das manchetes dos cards,
compactação do painel de mercado.
Pronto quando: os três blocos baterem com a foto master e o e2e `m00-shell` e
`m01-spanish-home` estiverem verdes.

## S2 · Apps sociais (código pronto; falta criar os apps)

O código da #467 está implementado e no ar: OAuth do Instagram e do TikTok com
vault AES-GCM, envio do plano por `POST /admin/social/send` e as guardas
`not_configured`/`no_media`. O que falta é só o lado do Owner:

> Leia `docs/STATUS.md`. Abra o Meta for Developers e o TikTok for Developers no
> meu Chrome e espere meu login. Crie os dois apps com os redirect URIs
> `https://coinblink-production.kayzendev.workers.dev/api/oauth/instagram/callback`
> e `https://coinblink-production.kayzendev.workers.dev/api/oauth/tiktok/callback`,
> capture ID e segredo sem exibir os valores e cole em `/admin/settings`
> (grupo Social).

Pronto quando: `META_APP_ID`, `META_APP_SECRET`, `TIKTOK_CLIENT_KEY` e
`TIKTOK_CLIENT_SECRET` salvos, as duas contas aparecendo em `/admin/social` e a
fila social com envio real funcionando.

## S3 · Billing live (decisão do Owner)

> Leia `docs/STATUS.md`. Vamos virar o Stripe para live: confira os preços,
> troque as chaves no painel e valide uma assinatura real de valor mínimo.

Pronto quando: assinatura live criada, webhook idempotente e entitlement ativo.

## S4 · M17 mídia própria (não iniciada)

> Leia `docs/STATUS.md`. Vamos definir o provedor de mídia do M17: opções,
> custo por imagem, direitos de uso, e implemente a geração com fallback para a
> capa SVG atual.

Pronto quando: um artigo tiver capa gerada por provedor e a SVG continuar como
fallback.
