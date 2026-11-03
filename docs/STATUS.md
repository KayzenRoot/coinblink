# CoinBlink · estado para retomar

Documento de handoff: leia isto antes de abrir o repositório inteiro.
Atualizado em 2026-11-03.

## Produção

- Worker `coinblink-production` · `https://coinblink-production.kayzendev.workers.dev`
- D1 `coinblink-cms` (`d47ec576-cec4-470e-966f-bc05b8cfcdc1`), migrações até `0020`
- Publicação automática **ligada**: `M08_AUTO_PUBLISH=on`, 3/hora, locale `en`
- Provedor: DeepSeek `deepseek-flash` (`https://api.deepseek.com/v1`), fallback Workers AI
- Agendador: `.github/workflows/auto-publish.yml` a cada 30 min → `POST /api/auto-publish`
- Fila social: `M07_IG_PER_DAY=10`, `M07_TIKTOK_PER_DAY=10`; envio real bloqueado (#437)

## Regras de produto já decididas

- `/news` mostra só os nossos artigos quando existe publicado; sem artigo, mantém o demo rotulado. A faixa de veículos saiu da página.

- Nenhuma notícia encaminha para o site da fonte; toda notícia abrível é publicada pelo CoinBlink.
- Artigos de IA levam o selo "published automatically · checked for citations, copying and numbers".
- Guardas: JSON, citação obrigatória, 8 palavras copiadas da manchete / 12 da página, número sem fonte.
- Migração aplicada fora do workflow **precisa** entrar em `d1_migrations` (ver memória do projeto).

## Pendências, em ordem

1. **Design**: S1 concluído (cards 9px→13px, radar em grid, painel de mercado colado ao conteúdo). Resta um S5 opcional para a home em telas largas. Sempre medir geometria antes de mexer.
2. **#437/#14**: apps Meta e TikTok — o Owner cria, depois preencher `META_APP_ID/SECRET` e `TIKTOK_CLIENT_KEY/SECRET`.
3. **#19**: Stripe live (decisão do Owner).
4. **#27**: mídia própria/vídeo (M17).

## Armadilhas conhecidas

- `npm run build` = `astro build`; rodar `node_modules/astro/bin/astro.mjs build`.
- e2e local exige `PUBLIC_BUILD_ENV=production` (o `.env` define production).
- Workflow M01-M05 só dispara para caminhos listados; se o PR não tocar nenhum, o check obrigatório nunca reporta e o merge fica BLOCKED.
- Gitleaks barra linhas parecidas com `key: '...'`; reescrever o commit resolve.
- Nunca commitar capturas/scripts temporários (já aconteceu duas vezes).
