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

## S2 · Apps sociais (bloqueada no Owner)

> Leia `docs/STATUS.md`. Vamos criar os apps Meta e TikTok. Abra as páginas de
> desenvolvedor no meu Chrome, espere meu login e siga do `Create app`.

Pronto quando: `META_APP_ID`, `META_APP_SECRET`, `TIKTOK_CLIENT_KEY` e
`TIKTOK_CLIENT_SECRET` salvos e a fila social com envio real funcionando.

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
