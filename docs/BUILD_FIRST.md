# Build-first workflow

**Goal:** ship a working local CoinBlink first. Tackle errors and polish continuously, without blocking all modules behind an external governance system.

1. Choose the next visibly useful feature in M01 Home, M05 local editor, or another product module.
2. Make a small code change on a feature branch. Keep the rest of the application working where practical.
3. Run `npm run build`, then launch `npm run dev` or `docker compose up --build`; check the feature visually.
4. Use focused tests for risky behavior or regression reproduction. Record bugs as ordinary GitHub issues and fix by severity, not through repeated approval rounds.
5. Open a PR and integrate through the repository's current GitHub settings. Simplify the outdated required-check ruleset using the repository Settings UI; file deletion does not change GitHub rulesets.
6. Repeat until the core product is usable. Triage remaining quality findings in batches.

**CI:** just install locked dependencies and compile. No automatic production deployment.

**Non-negotiable product protections:** never commit tokens or credentials; preserve user authentication/authorization and private draft isolation; never fabricate LIVE market/news data; do not publish externally without explicit owner authorization.

**Archive:** the previous framework's documents, workflow and packages were removed from this candidate branch. Historical Git commits remain recoverable. Original Blender, animation and QA media formerly nested in framework evidence are copied under `assets/archive/`.

## CMS local com um comando

Execute `npx playwright install chromium` uma vez, depois `npm run cms:local` para um CMS WebAuthn + D1 **somente local**. Veja [README](../README.md) para opção temporária, teste rápido e avisos. A rota de produção /admin permanece fechada; esse laboratório não publica conteúdo nem usa credenciais reais.

## Studio local: iniciar Home + CMS em um comando

`npm run studio:local` inicia a Home Astro em `127.0.0.1:4321` e o CMS M05 com D1 persistente local e credenciais WebAuthn **sintéticas** numa janela Chromium isolada. Requer `npm ci` e, na primeira utilização, `npx playwright install chromium`. Saia fechando a janela ou usando Ctrl+C. O banco local está em `.wrangler/coinblink-m05-drafts-local`, ignorado pelo Git. Não insira segredos reais, não é login de produção e não publica conteúdo.
