# CoinBlink

Crypto information and editorial experiences, built module by module. **Development-first:** prioritize a functioning local web application and improve features, tests and reliability iteratively.

## Run locally

Requirements: Node.js 22.19.0+, npm 10.x, and optionally Docker.

```bash
npm ci
npm run dev
# http://127.0.0.1:4321/en or /pt-br
```

```bash
npm run build
npm run preview
# or: docker compose up --build
# Docker local preview: http://127.0.0.1:3000/en
```

Use `npm run lint`, `npm run typecheck`, `npm run test:unit` or `npm run test:e2e` when investigating or fixing a feature. The minimal automated workflow checks only installation and build; it does not deploy.

## M05: CMS interativo com banco D1 LOCAL (sem GEF)

O M05 já inclui um laboratório de CMS com D1 local, rascunhos persistentes e duas credenciais WebAuthn **sintéticas**. Para abrir em um computador com interface gráfica:

```bash
npm ci
npx playwright install chromium
npm run cms:local
```

O comando abre uma janela Chromium isolada em **`https://owner.example.test/admin/login`**, interceptada pelo Playwright e não publicada na internet. Clique em "Sign in with test passkey" e edite rascunhos no laboratório local. O banco de rascunhos é mantido somente no PC em `.wrangler/coinblink-m05-drafts-local` (ignorado pelo Git). Credenciais de teste são recriadas ao iniciar; sessões anteriores são revogadas. Feche a janela para encerrar.

Comandos opcionais:

```bash
npm run cms:temporary    # mesmo editor; elimina o D1 temporário ao sair
npm run cms:smoke        # valida login / rascunhos / logout em Chromium headless
```

**Limites claros:** esse é um ambiente LOCAL com passkeys de teste, não o painel Owner de produção. O D1 local não é um cofre criptografado. Não coloque senhas, chaves privadas, tokens ou conteúdo confidencial nele. O `/admin` do Astro de produção continua inacessível; nenhum Worker é publicado e nenhuma conta Cloudflare é utilizada. A versão pública `/demo/editorial/articles/new` continua sem armazenamento e permite exportar/importar Markdown.


### Iniciar M01 + M05 juntos (ambiente LOCAL)

```bash
npm ci
npx playwright install chromium   # somente na primeira vez
npm run studio:local
```

Este comando inicia a Home no endereço `http://127.0.0.1:4321/en` (ou `/pt-br`) e abre uma janela **isolada** do M05 em Chromium com o Owner sintético. O rascunho D1 local fica em `.wrangler/coinblink-m05-drafts-local`. Fechar o navegador M05 ou interromper o terminal encerra o ambiente combinado. `npm run studio:check` apenas verifica se o launcher encontra os componentes instalados.

**Não é integração de produção:** os dois sistemas executam localmente, sem publicar artigos, usar credenciais reais ou fazer deploy. A Home demonstra ligações e conteúdo fictício; a janela do CMS não está disponível por uma URL pública.

## Roadmap

See [module catalog](docs/product/ROADMAP_AND_MODULE_CATALOG_v0.1.md), [product blueprint](docs/product/PRODUCT_BLUEPRINT_v0.1.md), [design bible](docs/design/COINBLINK_VISUAL_DESIGN_BIBLE_v2.0_DRAFT.md), and [development guide](docs/BUILD_FIRST.md).

The six official publisher links currently form an external-source directory, **not** a live news feed or a license to republish. UI demonstrations and local CMS fixtures must not be represented as production-ready integrations. Work on M01/M05 should focus on a usable Home and editor without blocking further module implementation.

## Continuidade dos chats e autorizações por botão

O proprietário prefere **respostas com botões clicáveis de escolha ou autorização**, especialmente para aprovar o próximo passo e squash merges após auditoria. Para continuar em outro chat, leia [o guia de interação e handoff](docs/CHAT_WORKFLOW_AND_HANDOFF.md) e peça ao assistente que siga esse padrão. Isso **não dá autorização automática** para merge, deploy ou mudanças de segurança. Preferência registrada na [Issue #160](https://github.com/KayzenRoot/coinblink/issues/160).

## Development policy

There is no GEF CLI, mandatory Work Order, module admission or checkpoint approval in the current development model. GitHub branch/ruleset settings are controlled separately from repository files and must be simplified there before retiring their legacy required-check contexts.

Keep product security boundaries, ownership of credentials, and explicit user authorization for any external production deployment. Local builds are safe and can run independently of production publishing.
