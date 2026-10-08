# COINBLINK — MASTER DE IDEIAS E PLANO INICIAL

> **Identificação:** PCN-IDEAS-001  
> **Versão:** 0.6.0 (CoinBlink escolhido como marca de trabalho; identidade preliminar e pendências de clearance)  
> **Data-base:** 08/10/2026  
> **Idioma do produto [ESCOLHA DO USUÁRIO]:** inglês (`en`) principal/canônico; português brasileiro (`pt-BR`) e espanhol (`es`) secundários, previstos desde o início  
> **Estado:** IDEIAS CONSOLIDADAS; ARQUITETURA E POLÍTICAS PROPOSTAS; NÃO IMPLEMENTADO  
> **Nome do projeto/marca de trabalho [ESCOLHA DO USUÁRIO]:** **CoinBlink**. Preferência confirmada em 08/10/2026; **ainda não é marca comercial liberada**, domínio adquirido, handle reservado ou identidade final aprovada. Verificar colisão fonética/visual com **Coinwink** e realizar clearance.  
> **Documento:** registro de visão e ideias. **Não substitui o Source Pack canônico**, que deverá ser criado e versionado no repositório antes da primeira implementação.

## 0. COMO LER ESTE DOCUMENTO

- **[ESCOLHA DO USUÁRIO]**: preferência ou requisito explicitamente informado pelo responsável pelo projeto.
- **[PROPOSTA]**: sugestão técnica/editorial ainda não aprovada de maneira formal.
- **[VALIDAÇÃO NECESSÁRIA]**: dado, fornecedor, licença, teto ou fluxo a verificar antes de produção.
- **NECESSARY / IMPORTANT / FUTURE / OUT OF SCOPE**: classificação de escopo para evitar expansão descontrolada.
- Números de pontuação, orçamentos e frequências aqui descritos são **hipóteses de projeto**, não resultados de benchmark nem promessas de receita.
- Sempre prevalece a futura hierarquia canônica: **Checkpoint > Decisions Ledger/ADRs > Scope > DoD > Architecture > Requirements > outras fontes**. Nenhum item deste brainstorm pode sobrescrever decisão formal aprovada.

---

## 1. VISÃO, MERCADO E MISSÃO

### Problema

O público recebe muitos títulos de notícias sobre criptomoedas, rumores, análises rasas e conteúdo duplicado. É difícil identificar o que realmente importa e entender impactos técnicos, econômicos e regulatórios.

### Solução pretendida

**[ESCOLHA DO USUÁRIO]** Construir um portal de notícias cripto muito profissional com coleta frequente, investigação complementar por inteligência artificial, publicação de **reportagens e explicações originais** e crescimento de audiência via X/Twitter.

A IA **não deve simplesmente reformular artigos de terceiros**. Ao detectar uma notícia, por exemplo uma atualização da Ethereum, deve procurar fontes primárias e complementares, conferir alegações, explicar o que mudou, para quem importa, quais riscos existem e o que permanece incerto.

### Objetivos

1. Lançar uma redação digital cripto de qualidade, não apenas um agregador de manchetes.
2. Destacar notícias **relevantes e potencialmente impactantes** e oferecer explicações didáticas e técnicas.
3. Publicar no site e distribuir os melhores assuntos no X de forma controlada.
4. Criar audiência, reputação e receita publicitária com banners não invasivos e patrocínios.
5. Manter **custos e quotas de APIs sob controle nos primeiros 3–4 meses**, sem extrapolar limites gratuitos/contratados.
6. Escalar APIs e automação posteriormente, com upgrade autorizado e dados reais de audiência/custos.
7. Preparar o portal antes de um **possível** ciclo favorável ao mercado cripto em 2027. **Não há garantia de boom.**

### Público inicial e idiomas

- **[ESCOLHA DO USUÁRIO]** Público internacional; **inglês é a experiência e redação canônica**.
- **[ESCOLHA DO USUÁRIO]** Português brasileiro e espanhol são línguas secundárias previstas no produto desde o primeiro incremento (interface, metadados e arquitetura).
- Leitores iniciantes e intermediários de diferentes países, investidores e profissionais interessados em informações verificadas.
- Traduzir **somente conteúdo editorial aprovado**, com publicação por idioma e critério de valor/custo; não publicar páginas com conteúdo principal em inglês disfarçadas de versões traduzidas.
- O Master histórico permanece redigido em português; a documentação canônica de engenharia e os identificadores de código do **novo** projeto serão elaborados em inglês, preservando revisões operacionais em português brasileiro.

### Princípios editoriais

- Verificabilidade > velocidade; utilidade > volume; clareza > sensacionalismo.
- O artigo precisa apresentar **valor adicional**, não paráfrase superficial.
- Separar fatos, interpretações, previsões e publicidade.
- Assinar/revisar, atribuir fontes, mostrar atualização e correções.
- Não prometer valorização de ativos, nem oferecer recomendação financeira individual.

---

## 2. IDENTIDADE, EXPERIÊNCIA E PRODUTO

### Direção visual [PROPOSTA]

- Design sofisticado de veículo financeiro: dark/grafite/preto com **uma cor de destaque discreta**, evitando visual genérico de templates de IA.
- Tipografia extremamente legível, hierarquia editorial, gráficos objetivos e identidade visual proprietária.
- Mobile first, rápido, acessível, sem pop-ups agressivos.
- Navegação principal em inglês: Latest, Top Stories, Bitcoin, Ethereum, Altcoins, Regulation, Security, Web3/DeFi, Learn, Analysis. Localizar rótulos em `pt-BR` e `es`.
- Página inicial com destaque principal, barra das notícias mais importantes, tendências explicadas e editorias.
- Página de artigo com manchete, subtítulo, contexto, resposta rápida, detalhamento, referências, horário da publicação/atualização, avisos apropriados e matérias relacionadas.
- Imagens próprias/licenciadas; não assumir direito de reutilizar fotos de outros portais.

### Marca de trabalho: CoinBlink [ESCOLHA DO USUÁRIO; CLEARANCE PENDENTE]

- **Nome preferido escolhido pelo usuário:** `CoinBlink` (CamelCase de marca). Digitação proposta: `coinblink` em URLs e handles **somente se disponíveis**. Não registrar ou usar comercialmente antes de clearance de marca e domínio.
- **Posicionamento editorial proposto:** portal global de notícias cripto com velocidade, apuração e contexto; não um serviço de alertas de investimento.
- **Tagline proposta, ainda não aprovada:** `Crypto news in a blink.` Alternativa descritiva: `Crypto news, clearly explained.`
- **Direção de símbolo [PROPOSTA]:** olho geométrico minimalista integrado a um aro de moeda com flash/traço rápido, inteiramente original e distinto do logotipo Coinwink. Boa leitura em favicon (16–32 px), avatar e app icon.
- **Paleta proposta [NÃO APROVADA]:** carvão `#0D1117`, verde-lima `#B8F34B` apenas em destaques, off-white `#F5F7FA`, cinza metálico `#657081`; contraste e acessibilidade deverão ser testados.
- **Experiência [PROPOSTA]:** tipografia editorial profissional, páginas rápidas, cartões de notícias, Radar 24h e animação breve de blink apenas decorativa, respeitando `prefers-reduced-motion`.
- **Idioma da marca:** `CoinBlink` permanece idêntico em inglês, português brasileiro e espanhol. Textos de navegação e matérias seguem o modelo multilíngue já aprovado para o projeto.
- **Riscos pendentes:** semelhança com **Coinwink** (serviço existente no universo cripto), confusão fonética, marcas nos territórios relevantes, domínios `.com`/`.com.br`, perfis X/Instagram/YouTube e direitos sobre elementos visuais. Se houver conflito impeditivo, reabrir naming antes de qualquer investimento em marca.
- **Fonte da decisão:** preferência expressa do usuário de 08/10/2026; seção 26 registra alternativas como histórico e pesquisa exploratória, não autorização jurídica.

---

## 3. MAPA DE MÓDULOS E PRIORIDADE

| ID | Módulo | Finalidade | Escopo |
|---|---|---|---|
| M01 | News Collector | Coletar metadados, manchetes e links de APIs/RSS/fontes oficiais | NECESSARY |
| M02 | API Budget Manager | Limites por provedor, minuto/hora/dia/mês, reserva, cache, 429/backoff | NECESSARY |
| M03 | Normalizer & Deduplicator | Canonical URL, identificador de evento, idioma, ativo e eliminações de repetidos | NECESSARY |
| M04 | Impact Engine com JEV | Rota editorial, classificação, impacto, incerteza e priorização | NECESSARY |
| M05 | AI Research Desk com DeepSeek | Investigar fatos, extrair e estruturar evidências | NECESSARY |
| M06 | Editorial Studio com DeepSeek | Escrever matérias originais, explicações e versões para redes | NECESSARY |
| M07 | Fact/Evidence Gate | Conferir alegações contra evidências e impor revisão humana | NECESSARY |
| M08 | News Portal | Portal público, categorias, navegação, artigos, busca e SEO | NECESSARY |
| M09 | X Publisher | Preparar e publicar no X quando autorizado pelas regras/cotas | NECESSARY |
| M10 | Command Center | Controle editorial, logs, fontes, custos, quotas, qualidade e falhas | NECESSARY |
| M11 | Ads Manager | Espaços de banners, campanhas, patrocínios e medição | IMPORTANT |
| M12 | Intelligence Analytics | Métricas de leitura e distribuição, qualidade e tendências | IMPORTANT |
| M13 | Newsletter | Resumo opt-in e patrocínio | FUTURE |
| M14 | Vídeos curtos/podcasts de IA | Conteúdo multiformato | FUTURE |
| M15 | App mobile e push | App, notificações e experiências exclusivas | FUTURE |
| M16 | Internationalization Core (i18n/l10n) | Idioma canônico `en`, interface `en`/`pt-BR`/`es`, rotas, schema e SEO internacional desde o começo; tradução integral progressiva e sujeita a custo | NECESSARY para a base multilíngue; expansão editorial IMPORTANT |
| M17 | Comunidade, assinaturas, API pública | Modelos alternativos de receita | FUTURE |
| M18 | Robô de trading integrado | Negociação automatizada com dinheiro real | OUT OF SCOPE |
| M19 | Radar Cripto 24h | Visão de principais acontecimentos, fonte e horário verificáveis | NECESSARY (experimento editorial do MVP, sujeito ao DoD) |
| M20 | Daily Crypto Brief (horários por região) | Seleção diária de notícias contextualizadas; rotina em inglês e versões por localidade conforme oferta editorial | NECESSARY (formato de conteúdo; horário 7h BR é variante regional, não regra global) |
| M21 | "Por que importa?" | Respostas didáticas e versão técnica na própria matéria | NECESSARY (template editorial) |
| M22 | Calendário Cripto | Eventos oficiais futuros confirmados e atualizados | IMPORTANT |
| M23 | Audience Intelligence Engine | Priorizar pautas pela demanda e utilidade com métricas agregadas | IMPORTANT (MVP: medição mínima) |
| M24 | Mapa de Impacto | Relacionar eventos a moedas/setores sem sugerir retorno garantido | IMPORTANT |
| M25 | Academia / Guias evergreen | Conteúdo original e educativo de longa duração | IMPORTANT |
| M26 | Páginas aprofundadas por ativo | Notícias, riscos, cronologia e fontes por cripto | IMPORTANT |
| M27 | Detector editorial de rumores | Evidência, checagem e sinalização de incerteza | IMPORTANT (bloqueio básico: já em M07) |
| M28 | Linha do tempo de eventos | Atualizações e correções vinculadas a uma pauta original | IMPORTANT |
| M29 | Alertas personalizados | Assuntos seguidos, opt-in e frequência configurável | IMPORTANT |
| M30 | Newsletter | Briefings voluntários diários/semanais e futura publicidade | IMPORTANT (reclassificação proposta de M13; implementar uma só vez) |
| M31 | Radar de golpes | Alertas explicativos de golpes confirmados, sem acusações infundadas | IMPORTANT |
| M32 | Telegram/WhatsApp channels | Distribuição permissionada, consentida e sem spam | IMPORTANT |
| M33 | Comparadores educacionais e calculadoras | Comparar redes e taxas / conversão informativa | FUTURE |
| M34 | Resumos em áudio e vídeos curtos | Reutilizar pautas verificadas em mídia, custos controlados | FUTURE |


> A classificação é uma **proposta inicial**. Todo incremento precisa demonstrar por que é NECESSARY para o DoD. Não construir tudo em paralelo.

---

## 4. FONTES DE NOTÍCIAS E ESTRATÉGIA DE COLETA

### 4.1 APIs de notícias [CANDIDATAS]

| Provedor | Franquia gratuita publicada em 08/10/2026 | Uso sugerido | Atenção |
|---|---:|---|---|
| **Currents** | 250 requests/dia, até 20 resultados no free | Descoberta complementar | Plano free voltado a protótipos; **resumos derivados voltados ao público exigem negociação específica** |
| **Marketaux** | 100 requests/dia, 3 artigos/request | Notícias financeiras e macro | Confirmar licença de uso em produto comercial |
| **The News API** | 100 requests/dia, 3 artigos/request | Assuntos gerais, regulação e macro | Confirmar direitos de uso comercial e acessos |
| **NewsData.io** | Plano free sujeito a créditos e atraso | Histórico/complemento | Verificar limite e atraso atuais antes de ativar |
| **GNews** | Plano free sujeito a atraso | Histórico/protótipo | Verificar termos e restrições comerciais |
| **NewsAPI.org** | Plano developer com atraso e restrições | Teste técnico | Não assumir elegibilidade para produção comercial |
| **CryptoCompare/CoinDesk Data** | Franquia do endpoint de notícias a confirmar | Fonte especializada | Checar credits por endpoint, cache, direitos |
| **CryptoPanic** | Elegibilidade gratuita a confirmar | Discovery cripto | Não depender até obter acesso confirmado |
| **Finnhub** | Endpoint e cotas de notícias a confirmar | Notícias financeiras | Checar franquia atual |
| **cryptocurrency.cv** | API comunitária, condições variáveis | Fonte experimental | Reputação, uptime, direitos e limites não garantidos |
| **GDELT** | Dados públicos, várias modalidades | Monitoramento global/macroeconômico | Mais trabalho de interpretação e eventuais mudanças de serviço |

**Fontes oficiais:**
- https://currentsapi.services/en/product/price
- https://www.marketaux.com/pricing
- https://www.thenewsapi.com/pricing
- https://newsdata.io/
- https://gnews.io/
- https://newsapi.org/
- https://developers.coindesk.com/
- https://cryptopanic.com/developers/api/
- https://finnhub.io/
- https://github.com/nirholas/cryptocurrency.cv
- https://www.gdeltproject.org/

### 4.2 RSS e fontes primárias

**Candidatos a RSS, sujeitos a checagem real de disponibilidade/licença:**
- CoinDesk: https://www.coindesk.com/arc/outboundfeeds/rss/
- Cointelegraph: https://cointelegraph.com/rss
- Decrypt: https://decrypt.co/feed
- The Block: https://www.theblock.co/rss.xml
- Blockworks: https://blockworks.co/feed
- CryptoSlate: https://cryptoslate.com/feed/

**Fontes primárias prioritárias para pesquisa:**
- Ethereum Foundation, blog da Ethereum, especificações EIPs e repositórios técnicos oficiais;
- Bitcoin Core e propostas BIP, quando aplicável;
- Comunicados regulatórios oficiais e registros públicos;
- Comunicados das redes/protocolos/exchanges, com clara indicação de eventual conflito de interesses;
- Dados públicos de mercado obtidos por APIs licenciadas e verificadas.

**Regra:** um RSS público não representa permissão irrestrita de republicação. Respeitar termos de uso, robots, intervalos, copyright, links originais e remoções. A coleta não pode ser confundida com aquisição de licença editorial.

### 4.3 Plano de polling de partida [PROPOSTA]

| Fonte | Intervalo | Chamadas/dia estimadas | Limite diário publicado | Ocupação planejada |
|---|---:|---:|---:|---:|
| Currents | 15 minutos | 96 | 250 | 38,4% |
| Marketaux | 30 minutos | 48 | 100 | 48% |
| The News API | 30 minutos | 48 | 100 | 48% |

- Os números pressupõem **uma chamada por ciclo**, cobertura de 24 horas, sem retries e sem endpoints adicionais. O total acima é **192 chamadas/dia** nos três fornecedores, não incluindo outros serviços.
- Reserve pelo menos 20% da cota para falhas, consultas pontuais e mudanças de fornecedor; interromper chamadas antes dos tetos reais.
- **RSS**: polling configurável inicialmente a cada 5–10 minutos por fonte, *somente onde permitido*; usar `ETag`, `If-Modified-Since` e backoff.
- Priorizar descoberta por fontes oficiais com licença adequada. Uma matéria urgente pode entrar via alerta próprio sem aumentar o polling geral.
- Quotas por hora e minuto devem ser descobertas nos contratos/documentação de cada provedor. Limite diário **não implica** ausência de limite por hora.
- **CoinGecko**: candidato para contexto de preços/mercado, não como API de notícias; checar custos por crédito e direitos comerciais antes de exibir cotações.
- **Meta de latência**: "quase tempo real". Não prometer notícia instantânea. Medir `published_at`, `discovered_at` e `published_site_at`.

### 4.4 API Budget Manager (requisitos)

- Rate limiter por provedor, endpoint e credencial, com janela de segundo/minuto/hora/dia/mês conforme contrato.
- `quota_remaining`, `reserved_requests`, `reset_at`, `usage_today`, `usage_month`, consumo por tipo, auditoria de 429/Retry-After.
- Requisições condicionais, cache por URL e conteúdo, dedupe de jobs, circuit breaker e retry com jitter exponencial.
- Limite rígido global e limite por serviço; **nunca incrementar plano ou saldo automaticamente**.
- Alarmes em 50%, 75%, 90% e 100% do **orçamento interno**; parar antes de violar o limite contratual.
- Testes de data/hora/UTC e contadores concorrentes; observabilidade por painel.
- Segredos server-side e separados por ambiente. Sem chaves no navegador ou repositório.

---

## 5. ARQUITETURA DE IA: JEV + DEEPSEEK

### 5.1 Papéis definidos

**[ESCOLHA DO USUÁRIO] DeepSeek será a LLM principal de geração textual.**

**[ESCOLHA DO USUÁRIO] JEV/TypeSafe será usado para escolhas estruturadas e para reduzir trabalho gerativo desnecessário.**

- **JEV (System One)** decide perguntas curtas com saídas tipadas: `Choice` (uma das opções), `Score` (pontuação numa escala) e `Noul` (probabilidade sim/não). Não redige artigos, não pesquisa fontes por conta própria, não substitui revisão factual.
- **DeepSeek** produz textos, sínteses, explicações, traduções e rascunhos, **recebendo evidências recuperadas por ferramentas**; não presumir acesso nativo à web em uma chamada de geração.
- **Código determinístico** faz tarefas que não exigem modelo: normalização, extração de datas/URLs, canonicalização, hashes, dedupe exato, limites, roteamento por regras e validação de JSON.
- **Revisor humano** intervém em risco alto, baixa confiança, rumores, alegações financeiras sensíveis e conflitos de fontes.

### 5.2 Pipeline econômico

```text
API/RSS/Fonte oficial
      |
      v
Validação de origem -> normalização -> dedupe exato/similaridade
      |
      v
Regras determinísticas (descarte óbvio, spam, duplicata, quotas)
      |
      v
JEV: classificação + risco + impacto + novidade + revisão necessária
      |
      +--> descartar / armazenar apenas metadata / fila de observação
      |
      +--> pauta -> recuperação de fontes primárias e documentos
                         |
                         v
                 DeepSeek: pesquisa/síntese estruturada
                         |
                         v
                 checagem factual, links e licenças
                         |
                         v
                 DeepSeek: texto original e formatos derivados
                         |
                         v
                 Evidence Gate + auditoria + revisão humana quando necessária
                         |
                         v
                 Portal público -> X Publisher -> métricas/correções
```

### 5.3 Matriz de decisões JEV [PROPOSTA]

| Pergunta | Primitiva JEV | Valores/resultado | Efeito |
|---|---|---|---|
| Qual editoria? | Choice | BTC, ETH, altcoins, regulação, segurança, macro, educação, outros | Rota temática |
| Tipo de evento? | Choice | anúncio oficial, incidente, investigação, opinião, promoção, rumor, outros | Fluxo apropriado |
| Importância editorial? | Score | 0–4 da rotina ao evento excepcional | Priorização |
| Precisa de investigação profunda? | Noul | 0–1 | Escalonar busca e DeepSeek |
| É provável duplicata sem fato novo? | Noul | 0–1 | Evitar nova pesquisa |
| Há ambiguidade/risco editorial? | Noul | 0–1 | Revisão humana |
| Qual formato para divulgação? | Choice | não publicar, portal, post X, thread X, revisão | Preparação editorial |
| O texto citado sustenta a alegação? | Choice/Noul com contexto de fonte | suportado, não suportado, insuficiente | Auxílio ao gate, não substitui prova |

**Uso correto:** perguntas atômicas, saída restrita e medição empírica de confiança. Uma resposta probabilística do JEV não é evidência factual. A publicação pode depender de múltiplas condições, com hard gates em código.

**Exemplo esquemático de request à API oficial do TypeSafe (contrato deve ser fixado em teste de integração):**

```json
{
  "model": "jev-latest",
  "state": {
    "headline": "Ethereum anuncia atualização de protocolo",
    "source_kind": "official_blog",
    "published_at": "2026-10-08T12:00:00Z",
    "asset_tags": ["ETH"]
  },
  "questions": {
    "topic": {
      "type": "choice",
      "instructions": "Classifique a editoria principal apenas a partir do estado.",
      "criteria": {
        "ethereum": "Ethereum, EIPs ou ecossistema ETH",
        "bitcoin": "Bitcoin ou BIPs",
        "regulation": "Leis e atos regulatórios",
        "other": "Outros assuntos"
      }
    },
    "impact": {
      "type": "score",
      "instructions": "Classifique importância jornalística potencial sem prever preços.",
      "criteria": ["rotina", "baixa", "moderada", "alta", "extraordinária"]
    },
    "needs_research": {
      "type": "noul",
      "instructions": "A pauta requer pesquisa complementar antes de qualquer publicação?"
    }
  }
}
```

**Endpoint oficial:** `POST https://api.typesafe.ai/v1/systemone` com credencial em variável de ambiente, não no frontend.  
**Documentação oficial:** https://docs.typesafe.ai/introduction e https://docs.typesafe.ai/api  
**Recomendações oficiais:** https://docs.typesafe.ai/patterns e https://docs.typesafe.ai/cookbooks/citation_check

### 5.4 Políticas de confiança e limites [PROPOSTA]

- Faixas de confiança são **a calibrar** com conjunto rotulado de notícias; não inventar um threshold universal seguro.
- Respostas incertas: `REVIEW`/`ABSTAIN`, jamais publicação automática por padrão.
- Todos os eventos sensíveis envolvendo hack, perda financeira, insolvência, rumor de listagem, acusações, manipulação ou risco legal exigem revisão humana.
- Analisar custo por decisão e benefício medido contra baseline sem JEV, pois **JEV também pode ter custo**.
- Preferir uma chamada JEV com questões independentes reunidas quando útil e permitido, evitando chamadas isoladas redundantes.
- Cache de decisões por `fingerprint(evento+versão de rubric+modelo+fontes)` com TTL; invalidar ao mudar fato, rubrica ou versão.
- Evitar usar JEV onde código determinístico resolve a decisão de forma comprovadamente suficiente.
- **Regra de falha:** indisponibilidade do JEV não libera o caminho automático; fallback barato determinístico ou fila de revisão.

### 5.5 DeepSeek: modelo e custos atualizados

- **Modelo inicial recomendado:** `deepseek-flash` (documentação oficial o identifica como **DeepSeek-V4.1-Flash** em 08/10/2026).
- **Base URL:** `https://api.deepseek.com`.
- Suporte a modos com e sem raciocínio e à resposta estruturada; parametrizar `reasoning_effort` de acordo com o trabalho, validando compatibilidade.
- **Baixo esforço / sem raciocínio intenso:** roteiros de formato, resumos simples, título alternativo, pequenas traduções, quando JEV/código não bastar.
- **Maior esforço:** explicar tecnologia complexa, reconciliar documentação extensa, analisar contrapontos, sempre com evidências recuperadas.
- **Context caching:** habilitado automaticamente pela plataforma DeepSeek, com benefícios principalmente quando prefixos correspondem; manter instruções editoriais/padrões **estáveis no início do prompt** e dados de evento variáveis depois.
- Instrumentar `prompt_cache_hit_tokens`, `prompt_cache_miss_tokens`, tokens de saída, custo e tempo por tarefa.
- Limites de custo hard cap e de saída (`max_tokens` apropriado), reconciliação por resposta e fatura, timeout, retries seguros, idempotência.
- Não enviar página inteira se bastam excertos citados; recuperação de fontes com trechos relevantes e dedupe.
- Não ativar navegação, downloads ou ferramentas por suposição: são componentes separados do sistema.
- Pin de versão/contrato quando disponível; manter adapter para substituição futura sem refazer pipeline.

**Preço observado em 08/10/2026 para `deepseek-flash`, por 1 milhão de tokens, USD (sujeito a alterações):**

| Item | Fora de pico | Pico |
|---|---:|---:|
| Input cache hit | $0.003 | $0.006 |
| Input cache miss | $0.15 | $0.30 |
| Output | $0.60 | $1.20 |

- Horários de pico conforme documentação oficial: 01:00–04:00 e 06:00–10:00 UTC de segunda a sexta (ressalvas de feriados chineses). Conferir sempre antes de automatizar agendamento.
- Pesquisa e publicações urgentes **não devem esperar off-peak** apenas para economizar centavos; usar off-peak em tarefas não urgentes.
- **Orçamento financeiro inicial sugerido, ainda não aprovado:** limites configuráveis para DeepSeek, JEV e X, com `monthly_spend_cap_usd` separado por provedor. Definir valores após teste real de custo por notícia.
- Não usar nomes de modelos antigos `deepseek-chat`/`deepseek-reasoner` sem checar compatibilidade atual.

**Referências DeepSeek:**
- https://api-docs.deepseek.com/quick_start/pricing/
- https://api-docs.deepseek.com/guides/thinking_mode/
- https://api-docs.deepseek.com/guides/kv_cache/
- https://api-docs.deepseek.com/guides/responses_api/

### 5.6 Métricas de economia de IA

- Custo JEV por 100 notícias coletadas.
- Custo DeepSeek por artigo publicado e por artigo descartado.
- Chamada DeepSeek evitada por filtro determinístico ou JEV.
- Percentual de cache hit e custo efetivo por 1M tokens.
- Precisão/recall da priorização contra conjunto de pautas rotuladas.
- Latência da coleta até a publicação.
- Taxa de matérias devolvidas à revisão / correções pós-publicação.
- **Benchmark obrigatório:** pipeline sem JEV versus pipeline com JEV em amostras equivalentes, incluindo **custo total (JEV + DeepSeek + infraestrutura)** e qualidade, não apenas tokens DeepSeek.

---

## 6. IMPACT ENGINE: IMPORTÂNCIA != CREDIBILIDADE

### 6.1 Pontuação editorial [HIPÓTESE]

| Critério | Peso máximo |
|---|---:|
| Importância potencial do evento | 30 |
| Relevância para o público/mercado | 25 |
| Novidade do fato | 20 |
| Abrangência dos afetados | 15 |
| Urgência temporal | 10 |
| **Total** | **100** |

Faixas exploratórias:
- **0–49**: rotina/arquivo;
- **50–79**: relevante e candidato a matéria;
- **80–100**: prioridade editorial para apuração.

**Crucial:** `impact_score` é independente de `evidence_confidence`, `legal_risk` e `publication_eligibility`. Um rumor com score 95 pode permanecer bloqueado.

### 6.2 Itens que podem ganhar prioridade

- Mudanças oficiais nas redes Bitcoin/Ethereum e em grandes protocolos.
- Vulnerabilidades e ataques com evidências sólidas.
- Decisões regulatórias e judiciais de impacto.
- Grandes anúncios sobre fundos e produtos financeiros (com verificação de fonte).
- Indisponibilidade de exchanges, interrupções de rede e atualizações relevantes.
- Informações de segurança ao usuário e educação de alto impacto.

### 6.3 Itens com restrição

- Posts promocionais de tokens, hype, rumores sem validação, preço sem causa verificável, aconselhamento financeiro disfarçado.
- Conteúdo derivado de uma só fonte sem verificação quando há alegações fortes.
- Publicações que apresentem previsões do próprio modelo como fatos.

---

## 7. FLUXO EDITORIAL, APURAÇÃO E PUBLICAÇÃO

1. **Descobrir**: registrar URL canônica, provedor, hash, título, horário original e metadados disponíveis legalmente.
2. **Deduplicar**: normalizar URLs, agrupar eventos, detectar notícia repetida com fato novo versus reedição.
3. **Classificar**: regras baratas → JEV nos casos elegíveis → filas separadas por relevância.
4. **Investigar**: recuperar fontes primárias, documentação técnica, comunicados e contraditório adequado.
5. **Construir Evidence Bundle editorial**: lista de alegações, cada uma com fonte, trecho, timestamp, nível de confirmação e licença/retenção.
6. **Produzir com DeepSeek**: artigo próprio e acessível, mantendo precisão técnica, termos explicados e links atribuídos.
7. **Revisar**: checar alegações, números, nomes, datas, aspas, direitos e riscos; JEV pode ajudar a classificar suporte de citações, mas **não substitui verificação independente**.
8. **Gates**: `AUTO_PUBLISH_ELIGIBLE`, `HUMAN_REVIEW`, `REJECT`, `WAIT_FOR_CONFIRMATION` definidos por política e testes.
9. **Publicar**: marcar data de publicação, data de atualização, versão e histórico editorial.
10. **Distribuir**: publicar X somente se licenciado/permitido, com mensagens variadas, sem spam e respeitando custos.
11. **Monitorar**: correções públicas, desempenho, denúncias, remoções e feedback.

### Estrutura de um artigo de referência

- Título informativo sem clickbait.
- Subtítulo com a essência do fato.
- **Em 30–60 segundos:** o que aconteceu, quando, fonte oficial, por que importa.
- O que mudou (antes/depois).
- Explicação passo a passo com exemplos didáticos.
- Para quem importa, possíveis riscos e limitações.
- O que sabemos e o que ainda não está confirmado.
- Contexto técnico, links às fontes e atualizações.
- FAQ/Glossário e assuntos relacionados, quando apropriado.
- Política visível de correções e avisos quando aplicáveis.

### Exemplo de pauta (FICTÍCIA)

**Gatilho:** notícia de atualização na Ethereum.  
**Apuração:** examinar blog oficial, especificações EIP pertinentes, cronograma, requisitos para validadores, limitações e riscos reais.  
**Produto:** "Atualização da Ethereum: entenda o que muda e por que isso importa" com linha do tempo, impactos possíveis e informações não confirmadas.  
**X:** post com síntese original e link, apenas após o gate editorial e dentro do orçamento.

---

## 8. X/TWITTER: AQUISIÇÃO E DISTRIBUIÇÃO

**[ESCOLHA DO USUÁRIO]** O portal terá integração oficial para publicar automaticamente as melhores notícias no X e ganhar audiência.

### Política de operação [PROPOSTA]

- Selecionar por impacto, evidência e valor para o leitor, e não por hype.
- Começar com **até 2–4 posts por dia** como experimento, autorizando automação somente em categorias auditadas.
- Manter fila, previews, logs, agenda, política anti-duplicação, limites de frequência e botão de suspensão.
- Templates distintos para link, explicação rápida, resumo técnico e thread curta.
- Usar gráficos/imagens originais com direitos apropriados.
- Monitorar cliques com UTMs, visitas efetivas, engajamento e conversão para leitura.
- Inserir revisão humana em posts de risco financeiro/legal, acusações e informações incertas.
- Observar políticas anti-spam e automação do X.

### Custos [VALIDAÇÃO NECESSÁRIA]

- A API do X altera preços, cotas e categorias de endpoints ao longo do tempo; **não fixar custos por post** no orçamento definitivo antes de testar a conta e o tipo exato de post.
- O custo e a autorização para postar links, anexar mídia, obter métricas e ler respostas devem ser validados separadamente.
- Se o X não for financeiramente viável no início, publicar manualmente/supervisionado com fluxo preparado e sem automação ilegal.

**Fontes:** https://developer.x.com/ e https://docs.x.com/

---

## 9. SEO, DISTRIBUIÇÃO E QUALIDADE DO CONTEÚDO

- URLs claras, slugs estáveis, canonical por idioma, `hreflang` entre variantes realmente publicadas, `x-default`, sitemap principal, sitemap de notícias onde apropriado e RSS próprio; ver §24.
- Dados estruturados `NewsArticle`/`Article` válidos, `datePublished` e `dateModified` reais.
- Metatags sociais, imagem de capa otimizada, OG/Twitter Cards.
- Conteúdo editorial de origem em inglês (`en`) para o público internacional, com traduções publicadas em `pt-BR` e `es` quando completas e aprovadas; especialização e atribuição de fontes para cada variante.
- Páginas institucionais: Sobre, Contato, Metodologia, Política Editorial, Correções, Privacidade, Termos, Publicidade.
- Search Console e métricas de indexação. Evitar criar centenas de páginas de baixo valor geradas automaticamente.
- Tratar desempenho Web Vitals, acessibilidade WCAG apropriada, contraste, teclado e leitura móvel.
- A publicação automática com IA só pode ser expandida com evidência de qualidade.
- Priorizar aquisição **Google Search + Google News + Discover** com conteúdo original e bom conteúdo visual; não prometer elegibilidade/posicionamento.
- Projetar briefing compartilhável e distribuível no X, canais opt-in e newsletter, com links canônicos e UTMs sem rastreamento excessivo.
- Páginas vazias, duplicadas ou geradas massivamente não devem ser indexadas; páginas por ativo exigem curadoria e valor único.
- Validar compatibilidade de recursos do Google News/Discover, metadados e programas de fontes preferidas conforme região/idioma antes do lançamento.
- Separar **notícias urgentes** (curto prazo), **guias permanentes** (SEO estável) e **ferramentas úteis** (retorno frequente).


---

## 10. MONETIZAÇÃO E EXPERIÊNCIA PUBLICITÁRIA

### Receita primária [ESCOLHA DO USUÁRIO]

**Banners publicitários elegantes e não invasivos** no portal.

### Espaços [PROPOSTA]

1. Banner premium responsivo, discreto no topo.
2. Patrocínio contextual integrado ao artigo, claramente rotulado como publicidade.
3. Bloco lateral/descritivo em desktop, sem atrapalhar o fluxo móvel.
4. Newsletter patrocinada (fase futura).
5. Patrocínio direto por marcas de ferramentas/serviços elegíveis.

### Guardrails

- Política de privacidade e consentimento quando necessários.
- Não exibir anúncios enganosos nem patrocínios ocultos; sinalizar conteúdo patrocinado.
- Não assumir aprovação imediata no AdSense; adequar conteúdo, site, tráfego e políticas.
- Produtos cripto e serviços financeiros podem exigir verificação especial e regras por país.
- **Não assumir faturamento nos primeiros meses.** Avaliar patrocínios diretos e AdSense após tráfego real.

---

## 11. STACK E ARQUITETURA DE SOFTWARE [PROPOSTA]

| Área | Sugestão inicial | Justificativa |
|---|---|---|
| Site público | Astro + TypeScript | Performance, renderização de páginas de notícia, SEO |
| CSS/UI | Tailwind CSS e design system próprio | Consistência visual e manutenção |
| Áreas interativas | React em ilhas/componentes | Evitar hidratar o site inteiro |
| API/backend | Cloudflare Workers, **sujeito a POC** | Baixa operação e cron básico |
| DB | Cloudflare D1, **sujeito a limites reais** | Dados editoriais relacionais na primeira versão |
| Imagens | Cloudflare R2 ou alternativa aprovada | Armazenamento de ativos licenciados |
| Jobs | Cron Triggers + fila/worker idempotente quando necessário | Coleta, pesquisa, publicação e retry |
| Autenticação admin | Solução madura, sessões seguras e MFA quando disponível | Segurança do Command Center |
| Busca V1 | Busca simples indexada ou serviço eficiente | Não instalar cluster pesado sem necessidade |
| Editor | Markdown/MDX restrito ou editor estruturado seguro | Conteúdo versionável e auditável |
| LLM | DeepSeek API (`deepseek-flash` inicialmente) | Redação/síntese, com adaptador e orçamento |
| Decisões IA | TypeSafe JEV System One API | Triagem/classificação/roteamento econômico |
| Testes | Vitest + Playwright + integration contract tests | Qualidade mensurável |
| CI/CD | GitHub Actions | Checks, evidências, PR e deploy |
| Observabilidade | Logs estruturados, métricas e alertas | Quotas, custos, falhas editoriais e filas |

**Atenção:** limites do plano gratuito do host, CPU por execução, cron, egress, volume de escrita, storage, site comercial e retenção devem ser avaliados por POC. Se processamento de IA exigir jobs duráveis mais longos, adicionar um worker dedicado de forma incremental. Não presumir que tudo caberá dentro de um único request serverless.

### Fluxo de dados lógico

`Source -> SourceEvent -> CanonicalEvent -> Decision -> ResearchBundle -> Draft -> Verification -> Approval -> Publication -> Distribution -> Performance`.

Entidades propostas: `sources`, `source_events`, `events`, `event_sources`, `decisions`, `evidence_claims`, `articles`, `article_versions`, `review_tasks`, `publication_jobs`, `social_posts`, `api_usage`, `model_usage`, `cost_ledgers`, `audit_logs`, `ad_slots` (depois).

Regras de dados: provenance, IDs estáveis, UTC, integridade referencial, versionamento de matéria, reprocessamento idempotente, retenção permitida pelas fontes, anonimização quando aplicável.

---

## 12. COMMAND CENTER: INTERFACE ADMINISTRATIVA

- Tela de visão geral: coletadas hoje, eventos únicos, selecionadas, publicadas, pendentes e descartadas.
- Filas de ingestão, apuração, revisão, publicação, X e erro.
- Painel API Budget: uso contra franquias por hora/dia/mês, resets, próximos polls, pausas.
- Painel AI Cost: JEV, DeepSeek, tokens, cache hit, custo por matéria, tendência mensal.
- Editor humano: comparar evidências e artigo, corrigir, aprovar/rejeitar, acompanhar histórico.
- Fonte e confiabilidade: dados de origem, licenças, duplicatas, saúde do feed, slas informais.
- Métricas de engajamento: leitores, buscas, links do X, melhores categorias.
- Interruptores de segurança: pausar X, pausar DeepSeek, pausar API, suspender auto-publicação.
- RBAC simples e auditável, backups, tratamento de erros e trilha de alterações.

---

## 13. SEGURANÇA, LICENÇAS E CONTROLES

1. **Direitos autorais:** nunca pressupor licença para reescrever, guardar textos completos, montar RAG permanente ou redistribuir dados de fornecedores. Currents afirma que *customer-facing AI summaries* não vêm incluídos por padrão no self-service.
2. **Fonte não confiável:** páginas, RSS, PDFs e posts podem conter prompt injection. Sanitizar e separar conteúdo externo de instruções do agente.
3. **Segredos:** chaves DeepSeek, JEV, X e APIs sempre server-side, criptografadas/em secrets manager; jamais frontend, logs completos ou Git.
4. **Publicação:** gates explícitos, modo rascunho por padrão, kill switch e reversibilidade; logs de quem/quando/o que aprovou.
5. **Financeiro:** conteúdo informativo e não promessa de retorno; cuidado com difamação, alegações de fraude, cotações e regulação aplicável.
6. **Privacidade:** LGPD, cookies, consentimentos e retenção mínima quando necessário.
7. **Vulnerabilidades:** rate limit em endpoints próprios, CSP, segurança XSS/CSRF, MFA, backups, restauração e monitoramento.
8. **Integridade:** jobs idempotentes, versões imutáveis do conteúdo publicado, rastreabilidade de fontes e correções.
9. **Qualidade:** fontes independentes e primárias, múltiplas perspectivas e auditoria; probabilidades JEV não são prova.
10. **Mudanças de contrato:** revisar periodicamente preços, cotas, APIs e termos antes de renovar planos.

---

## 14. CRONOGRAMA DE 4 MESES [ALVOS, NÃO GARANTIAS]

### Mês 1 — Outubro de 2026: fundação + MVP publicável

- Escolher marca/identidade, domínio, público e posicionamento.
- Criar **Source Pack canônico** completo no repositório antes do código: README/Hierarchy, Overview, Requirements, Scope, Architecture, Security, Test/Benchmark Plan, Deployment, Backlog, DoD, Decisions Ledger/ADRs e Checkpoint.
- Criar interfaces essenciais, banco, primeiro coletor, regras de dedupe, portal com conteúdo editorial de demonstração claramente identificado e deploy.
- Validar licenças das fontes que serão usadas publicamente e seus limites.
- Integrar métricas básicas de coleta/custo.

### Mês 2 — Novembro de 2026: inteligência editorial

- JEV triagem e score em regime sombra (`shadow mode`) contra baseline.
- DeepSeek pesquisa, rascunho e verificação.
- Evidence Gate e painel de revisão humana.
- Testes dos padrões editoriais, benchmark de custo e qualidade.
- X: credencial oficial, enquadramento de custo e posts supervisionados.

### Mês 3 — Dezembro de 2026: distribuição e SEO

- Publicações regulares e estáveis dentro das quotas.
- Search Console, sitemap, analytics e melhoria de Web Vitals.
- Ajustar thresholds JEV com corpus rotulado e medir erros.
- Lançar Radar Cripto 24h e Briefing das 7h em forma editorial leve se o pipeline de qualidade estiver aprovado; conteúdo condicionado à existência de notícias relevantes.
- Automatizar apenas categorias comprovadamente seguras.
- Melhorar formato X e medir tráfego de retorno.

### Mês 4 — Janeiro de 2027: estabilidade e monetização

- Auditoria de confiabilidade, custos, segurança, licenças, editorial, SEO.
- Construir somente módulos IMPORTANT que demonstrarem necessidade para aquisição/retorno real da audiência.
- Espaços publicitários preparados sem degradar a experiência.
- Avaliar elegibilidade AdSense e propostas de patrocínio.
- Reavaliar APIs pagas com base em volume, latência, audiência e receitas reais.
- Documentar checkpoint da versão e próximos incrementos.

---

## 15. DEFINIÇÃO DE PRONTO: PROPOSTA PARA A PRIMEIRA VERSÃO

Não considerar a V1 encerrada até que, no mínimo:

- [ ] O Source Pack exista no Git e esteja coerente com código/PRs.
- [ ] Portal público acessível em produção, responsivo e funcional, com navegação/artigos reais legalmente publicados.
- [ ] Template público contenha resumo factual e "Por que importa?" com fontes; Radar 24h e Briefing tenham publicação consistente e possam indicar ausência de notícias relevantes.
- [ ] Ingestão de fonte(s) aprovadas, sem exceder quotas contratadas (teste e monitoramento).
- [ ] Deduplicação e fila editorial persistentes, com idempotência e retries controlados.
- [ ] JEV empregado apenas onde supera alternativas determinísticas segundo medição.
- [ ] DeepSeek integrado com custo rastreado, controle de cache e saídas verificadas.
- [ ] Toda afirmação material em matérias automatizadas tenha evidências auditáveis.
- [ ] Conteúdo de risco elevado vá para revisão humana; operação tenha kill switch.
- [ ] Publicação no X funcione **se o acesso legal/comercial estiver disponível**, caso contrário gate de negócio explícito, sem contorno indevido.
- [ ] SEO técnico, acessibilidade, política editorial/correções, privacidade e publicidade identificável estejam implantados.
- [ ] Testes unitários, integração, E2E, lint, typecheck, build, segurança e performance aplicáveis estejam verdes.
- [ ] Deploy, health checks, backup/restore e trilha de evidências validados.
- [ ] Auditoria independente de Scope/Requirements/Architecture/DoD emita `APPROVED`.
- [ ] Checkpoint final e decisões canônicas sejam atualizados **após auditoria**.

---

## 16. GESTÃO DE ENGENHARIA (PROCESSO DO PROJETO)

1. `ANALYZE -> SOURCE CHECK -> NEXT NECESSARY INCREMENT -> WORK ORDER -> CONTEXT LOCK -> PREFLIGHT -> EXECUTOR -> TESTS/EVIDENCE -> PR -> AUDIT -> APPROVED / CORRECTION REQUIRED / BLOCKED -> CHECKPOINT DELTA -> MERGE -> NEXT`.
2. Cada Work Order deve conter `OBJECTIVE`, `CONTEXT`, `SCOPE`, `OUT OF SCOPE`, `FILES/SOURCES TO READ`, `REQUIREMENTS`, `ARCHITECTURE RULES`, `CONSTRAINTS`, `ACCEPTANCE CRITERIA`, `TESTS`, `DELIVERABLES`, `REVIEW FORMAT`, `STOP CONDITION`.
3. ID estável no branch, PR, evidências, correções e checkpoint. Uma WO ativa por caminho crítico; não avançar se tiver `CORRECTION REQUIRED` ou `BLOCKED`.
4. Context Lock com base/head SHA e hashes críticos quando possível; ao mudar fonte canônica, declarar STALE e reconstruir contexto.
5. Evidence Bundle auditável com testes, lint/typecheck/build, segurança, custos quando aplicáveis, riscos, diffs e delta de checkpoint proposto.
6. Executor não aprova a própria mudança; revisão independente antes de merge.
7. Sem force push, reescrita de histórico ou ação destrutiva sem autorização explícita.
8. Tratar tráfego de API comercial e publicação automática como mudanças com riscos que exigem testes, guardrails e rollback.

### Primeiro Work Order sugerido (ainda NÃO emitido)

**PCN-WO-001 — Source Pack + decisão de stack/contratos + baseline**  
Objetivo: criar a documentação canônica, ADRs de DeepSeek/JEV/ingestão/hosting/monetização, processo de validação das licenças e PoC de quotas, sem implementar todo o produto.

**Stop condition:** Source Pack completo, coerente, revisado, aprovado e com checkpoint formal de prontidão para a primeira feature. **Não iniciar essa implementação no mesmo incremento.**

---

## 17. DECISIONS LEDGER PRELIMINAR (NÃO SÃO ADRs APROVADOS)

| ID provisório | Decisão / direção | Origem | Estado |
|---|---|---|---|
| P-001 | Construir portal cripto com pesquisa e explicação originais, não cópia de notícias | Usuário | ESCOLHA DO USUÁRIO |
| P-002 | Crescer audiência com publicação selecionada no X | Usuário | ESCOLHA DO USUÁRIO |
| P-003 | Monetizar principalmente por banners discretos | Usuário | ESCOLHA DO USUÁRIO |
| P-004 | Não ultrapassar franquias de APIs nos primeiros 3–4 meses | Usuário | ESCOLHA DO USUÁRIO |
| P-005 | DeepSeek como LLM principal | Usuário | ESCOLHA DO USUÁRIO |
| P-006 | JEV para classificação, priorização e economia de geração | Usuário | ESCOLHA DO USUÁRIO |
| P-007 | **SUBSTITUÍDO em v0.4:** idioma principal `en`, secundários `pt-BR` e `es`, com suporte arquitetural desde o início | Usuário | ESCOLHA DO USUÁRIO |
| P-008 | Astro/Workers/D1/R2 como stack de MVP | Assistente | PROPOSTA / POC |
| P-009 | Evidence Gate e revisão humana para notícias sensíveis | Assistente | PROPOSTA DE SEGURANÇA |
| P-010 | Quatro meses de evolução: fundação -> IA -> distribuição -> receita | Assistente | PROPOSTA |
| P-011 | DeepSeek Flash como primeiro modelo da linha DeepSeek | Assistente + docs atuais | PROPOSTA TÉCNICA |
| P-012 | JEV em shadow mode e adoção mediante benchmark | Assistente | PROPOSTA TÉCNICA |
| P-013 | Conteúdo legalmente licenciado/apurado, sem usar feed comercial como licença | Restrição legal/técnica | VALIDAR |
| P-014 | Manter todas as ideias novas de aquisição e retenção registradas no Master, sem ampliar a V1 automaticamente | Usuário: salvar ideias | IDEIAS REGISTRADAS |
| P-015 | Radar Cripto 24h, Briefing 7h e "Por que importa?" como pilares propostos de audiência | Assistente; usuário gostou do conjunto | PROPOSTA PARA DoD/PRIORIDADE |
| P-016 | Audience Intelligence orienta temas por dados agregados sem sacrificar verificabilidade | Assistente | PROPOSTA |
| P-017 | **CoinBlink é marca de trabalho preferida**, a validar juridicamente/digitalmente; shortlist histórica não define marca | Usuário: escolheu CoinBlink em 08/10/2026 | ESCOLHA DO USUÁRIO / CLEARANCE PENDENTE |
| P-018 | Naming deve ser global, em inglês, fácil de lembrar e claramente ligado ao mercado cripto | Usuário | ESCOLHA DO USUÁRIO |
| P-019 | Suporte técnico a `en`, `pt-BR` e `es` é NECESSARY desde a primeira versão; volume de tradução deve ser ajustado a custos e qualidade | Usuário (idiomas) + especificação técnica de implementação | REQUISITO + PROPOSTA DE ESCOPO |
| P-020 | Direção visual proposta da marca CoinBlink: olho/moeda/flash, grafite + lime, tipografia editorial; não fabricar símbolo parecido com Coinwink | Assistente, inspirada na preferência CoinBlink | PROPOSTA VISUAL / A VALIDAR |


---

## 18. RISCOS, LACUNAS E PERGUNTAS ABERTAS

### Riscos altos

- API "grátis" usada indevidamente em produto comercial ou com conteúdos derivados sem licença.
- Publicar informação financeira não verificada ou difamatória.
- Publicação automática no X sem direito, orçamento ou conformidade.
- Pautas massificadas sem utilidade real prejudicando SEO/reputação.
- Custo total JEV + DeepSeek maior que alternativa mais simples.
- Dependência excessiva de um provedor/hosting e cron que não comporta tempo de execução.

### Pendências para decisões formais

- **CoinBlink selecionado como nome de trabalho**; pendentes clearance de marca (INPI/USPTO/EUIPO conforme mercados), semelhança com Coinwink, domínio via registrador/RDAP, handles, logotipo original, validação de paleta, identidade visual e guideline editorial.
- Formatos editoriais por canal, frequência de newsletters e regras anti-spam na fase de expansão.
- Conta TypeSafe e plano JEV: limites, créditos, custo e compliance.
- Conta DeepSeek: saldo, limites de saída, região, termos e custo real.
- Fontes primárias e RSS aprovados juridicamente; quais agregadores podem ser usados em fluxo editorial comercial.
- API do X: disponibilidade, custo concreto de posts com links, mídia, leitura e regras de automação.
- Infra de deploy e orçamento mensal máximo autorizado.
- Políticas de revisão humana e thresholds validados com dados.
- Volume de matérias diárias sugerido: **3–6 matérias excelentes**, apenas se houver fatos suficientes para justificar o volume.
- Requisitos de consentimento, proteção de dados, anúncios e declarações editoriais.

---

## 19. REFERÊNCIAS E DOCUMENTAÇÃO CONSULTADA

**Fontes consultadas em 08/10/2026 ou utilizadas como roteiro para validação posterior.** Informações de preço/limite podem mudar e devem ser rechecadas no preflight.

**TypeSafe / JEV (documentação oficial):**
- https://docs.typesafe.ai/introduction
- https://docs.typesafe.ai/api
- https://docs.typesafe.ai/primitives
- https://docs.typesafe.ai/patterns
- https://docs.typesafe.ai/introduction/coding-agents
- https://docs.typesafe.ai/cookbooks/citation_check
- https://docs.typesafe.ai/cookbooks/parallel_questions

**DeepSeek (documentação oficial):**
- https://api-docs.deepseek.com/quick_start/pricing/
- https://api-docs.deepseek.com/guides/kv_cache/
- https://api-docs.deepseek.com/guides/thinking_mode/
- https://api-docs.deepseek.com/guides/responses_api/

**Feeds/APIs/infra/distribuição:**
- https://currentsapi.services/en/product/price
- https://www.marketaux.com/pricing
- https://www.thenewsapi.com/pricing
- https://developer.x.com/
- https://docs.x.com/
- https://developers.google.com/search/docs
- https://developers.cloudflare.com/
- https://astro.build/

---

## 20. RESUMO EXECUTIVO E PRÓXIMO PASSO

**O que preservar:** portal cripto premium em inglês com localizações em português e espanhol, apuração em profundidade, notícias prioritárias, textos originais, integrações X, monetização por publicidade discreta, 3–4 meses de baixos custos e respeito estrito às quotas; **DeepSeek = escrita/pesquisa; JEV = decisões/roteamento**; métricas e evidências antes de escalar.

**Próximo incremento recomendado:** constituir repositório e Source Pack, validar direitos de uso dos feeds, executar POC econômica JEV+DeepSeek e registrar decisões formais. **Nada foi implantado, executado ou aprovado apenas pela existência deste documento.**

---

*Fim do conteúdo original da versão v0.1.0, preservado acima; extensões v0.2.0 a seguir.*


---

## 21. CRESCIMENTO DE AUDIÊNCIA: IDEIAS CONSOLIDADAS EM 08/10/2026

> **Origem:** recomendações apresentadas e recebidas positivamente pelo usuário. **Status:** backlog de ideias preservadas. Não significam aprovação automática para implementação, contratação de serviços ou expansão da V1. O DoD e o fluxo de Work Orders continuam soberanos.

### 21.1 Hipótese central de produto

Ser mais útil do que um agregador: unir notícias rápidas, explicações verificadas e ferramentas que motivam retorno habitual. Diferenciais propostos:

1. **Radar Cripto 24h:** área viva com até cinco pautas essenciais, data/hora da descoberta e fonte original, ativos associados, score de impacto e confiança factual separados, link para apuração; sem prometer fluxo segundo a segundo.
2. **Daily Crypto Brief:** resumo diário em inglês com horário alinhado à audiência internacional; uma edição brasileira às 7h é uma localização possível, não a única; edições `pt-BR` e `es` devem derivar de fatos validados e ter blocos locais quando houver valor editorial.
3. **"Por que importa?" em toda matéria:** explicar o que aconteceu, para quem importa, consequências potenciais, o que ainda não sabemos e próximos marcos, com linguagem iniciante + detalhe avançado.
4. **Calendário cripto inteligente:** upgrades de blockchain, audiências regulatórias, decisões financeiras, desbloqueios de tokens relevantes e outros eventos com origem primária; distinguir previsto, adiado, cancelado e ocorrido; alertas só com evidência.
5. **Mapa de impacto:** vincular acontecimentos a categorias (BTC, ETH, DeFi, stablecoins, L2, RWA etc.) com impactos editoriais hipotéticos; nunca retratar ligação causal ou retorno como certeza.
6. **Aprenda sem complicação:** artigos duráveis sobre autocustódia, staking, segurança, redes, ETFs, golpes e tributação com data de revisão e aviso de variação jurisdicional.
7. **Páginas completas por ativo:** notícias relacionadas, cronologia, documentação oficial, riscos e explicações. Apenas ativos/páginas com valor editorial suficiente devem ser indexados.
8. **Detector de rumores:** contexto de origem, evidências independentes, negações, status "não confirmado" e trilha de alterações. Rumor grave não pode ser autopublicado.
9. **Linha do tempo de eventos:** continuidade de pautas, versões, novidades substanciais e correções, com horário de cada atualização.
10. **Alertas por ativo:** seguir moedas/temas, frequência ajustável, consentimento, botão de cancelamento e quiet hours quando aplicável.
11. **Newsletter diária/semanal:** canal proprietário com opt-in, briefing editorial, links canônicos e futura possibilidade de patrocínio identificado.
12. **Radar de golpes:** conteúdo educativo e verificável, sem acusações injustificadas a pessoas ou empresas.
13. **Comparador de projetos:** comparação por tecnologia, casos de uso, documentações, taxas e riscos, não ranking de investimentos.
14. **Calculadoras gratuitas:** conversão informativa BTC/BRL e taxas estimadas com fonte/hora dos dados e avisos de desatualização.
15. **Resumos em áudio/vídeo:** distribuição multiformato a partir de fatos já verificados, com checagem final do roteiro.

### 21.2 Distribuição: cinco canais

| Canal | Objetivo | Execução inicial sugerida | Regra |
|---|---|---|---|
| Google Search/News/Discover | Audiência de descoberta orgânica | SEO técnico, pauta original, imagem adequada, hierarquia editorial e dados estruturados | Sem promessa de indexação/tráfego |
| X | Velocidade, marca, comunidade | Curadoria das melhores matérias, cards originais, poucas publicações genuinamente diferentes | Usar API oficial conforme termos, quota e custo |
| Telegram e canal de WhatsApp | Leitores recorrentes | Distribuição manual ou assistida em canal opt-in; integrar API oficial se elegível | Sem automação não autorizada/spam |
| Newsletter | Audiência própria | Opt-in explícito e edição breve | LGPD, descadastro, limite de envios |
| Shorts/Reels/TikTok/YouTube | Ampliar descoberta, fase posterior | Recortes originais de pautas verificadas | Direitos de imagens/áudio e transparência |

### 21.3 Audience Intelligence Engine [PROPOSTA / IMPORTANT]

**Objetivo:** identificar o que a audiência quer entender e quais explicações geram utilidade e retorno, não otimizar clickbait.

**Entradas:** Search Console, web analytics com privacidade, buscas internas agregadas, desempenho das publicações, tendências públicas permitidas e sugestões dos leitores.

**Fluxo:** normalização barata -> detecção de tendências -> JEV classifica oportunidade editorial -> DeepSeek pesquisa apenas pautas aprovadas -> validação de evidências -> distribuição -> mensuração -> ajuste de priorização.

**Regras:**
- A demanda não substitui a necessidade de fontes confiáveis; novidade, valor público e evidência continuam decisivos.
- Não coletar dados pessoais excedentes para construir perfis sensíveis; respeitar consentimento, retenção e anonimização/agrupamento.
- Métricas de impacto e métricas de qualidade devem ser separadas; ninguém "treina" o sistema a maximizar títulos sensacionalistas.
- Antes de usar JEV em produção, comparar com regras determinísticas e medir **custo total, qualidade, falsos positivos e falsos negativos**.
- Registrar experimentos de título/thumbnail com integridade factual (nunca mudar conteúdo para otimizar CTR enganoso).

### 21.4 Home page proposta

1. Cabeçalho compacto, logo e menu de editorias; navegação instantânea em celular.
2. Barra curta do **Radar Cripto 24h** com horário verificável.
3. Uma **grande reportagem** com explicação original e fontes.
4. Grade de conteúdo mais importante + bloco "Por que importa?".
5. Acesso direto ao **Calendário Cripto** e à seção **Aprenda**.
6. CTA leve para newsletter/Briefing e canais sociais (sem intersticiais).
7. Espaços publicitários discretos, claramente rotulados e só ativados quando permitidos.
8. Rodapé institucional, equipe/contato, metodologias, políticas e correções.

**Princípio de UX:** editorial sóbrio, dark elegante, ênfase em legibilidade, performance móvel e Core Web Vitals; animações e efeitos apenas se forem leves.

### 21.5 KPIs, testes e crescimento

**Aquisição:** visitantes novos, origem orgânica, X e outros canais, impressões e CTR por canal com contexto.

**Retenção:** visitantes recorrentes, frequência de retorno, páginas úteis por visita, leitura real, cliques no Briefing, inscrições voluntárias.

**Qualidade editorial:** percentual de alegações com fonte verificável, correções, atualizações atrasadas, matérias rejeitadas e taxa de rumores bloqueados corretamente.

**Custo e confiabilidade:** custo completo por matéria aprovada (DeepSeek + JEV + infra), custo por canal, quota consumida, dedupe, atrasos, erros 429/5xx, SLA interno (não prometer real-time sem evidência).

**Receita:** receita por mil pageviews e taxa de preenchimento de posições, somente após existir monetização efetiva; separar anúncios diretos/AdSense.

**Hipóteses a testar** (sem promessas): títulos claros elevam conclusão de leitura; Briefing aumenta retorno; Radar aumenta visitas diretas; newsletter reduz dependência do X.

### 21.6 Plano evolutivo sem expandir DoD

- **Outubro de 2026 / Mês 1:** Source Pack, marca e domínio, coletor licenciado, experiência de leitura, conteúdo real controlado e SEO técnico; a home já pode mostrar o Radar em versão simples.
- **Novembro de 2026 / Mês 2:** DeepSeek+JEV auditados, template "Por que importa?", Radar e Briefing editoriais, publicação supervisionada no X.
- **Dezembro de 2026 / Mês 3:** Search Console/Analytics, formatos sociais e testes de retenção; se justificado, calendário de eventos e guias permanentes mínimos.
- **Janeiro de 2027 / Mês 4:** confiabilidade/custo, newsletter experimental se necessária, monetização preparada e escolha de expansão baseada em métricas.

**STOP CONDITION:** não promover itens IMPORTANT/FUTURE para implementação sem Work Order e evidência de necessidade para DoD; nenhum canal pode violar regras de distribuição ou licenças.

---

## 22. NAMING: PORTAL DE NOTÍCIAS CRIPTO [SHORTLIST PRELIMINAR]

### 22.1 Requisitos históricos (SUPERADOS por P-018 na v0.4)

- Requisito histórico: nome curto, memorável e pronunciável em português. **Decisão posterior e superior:** nome em inglês, global, diretamente evocativo de cripto, pronunciável em inglês e entendível também em português/espanhol; candidatos em português continuam documentados apenas como histórico.
- Um visitante deve identificar imediatamente a relação com criptomoedas; preferência por nomes com **"Cripto"**.
- Objetivo de uma **marca distintiva/exclusiva**, sujeita à verificação jurídica e comercial; exclusividade não pode ser prometida por busca comum na internet.
- Adequação a site, logo, newsletter, X, @handles, favicon, futura internacionalização.
- Evitar associação com exchange, sinais de compra/venda ou promessa de lucro.

### 22.2 Lista criativa de candidatos para triagem

| Nome | Ideia/posicionamento | Leitura de marca | Status em 08/10/2026 |
|---|---|---|---|
| **CriptoPauta** | Jornalismo, agenda do setor, notícia que importa | Associação direta à imprensa; soa confiável | **Finalista preliminar; clearance pendente** |
| **CriptoSonda** | Investigação, checagem, notícia além da superfície | Distintivo; transmite apuração | **Finalista preliminar; clearance pendente** |
| **CriptoMira** | Foco no essencial e acontecimentos do dia | Curto, fácil de falar, forte para logo | **Finalista preliminar; clearance pendente** |
| CriptoFio | Contexto, conexão dos acontecimentos, fio de notícias | Curto, mais conceitual | Não validado |
| CriptoNota | Nota editorial, atualização rápida | Fácil e editorial | Não validado |
| CriptoTese | Análise, explicação e entendimento | Mais analítico que noticioso | Não validado |
| CriptoLente | Olhar aprofundado e didático | Excelente para conteúdo explicativo | Não validado |
| CriptoVisor | Observação e notícias do mercado | Visual tecnológico e forte | Não validado |
| CriptoVigia | Vigilância informativa do mercado | Fácil de lembrar; pode soar alarmista | Não validado |
| CriptoClareza | Traduzir complexidade em entendimento | Muito didático; nome mais longo | Não validado |
| CriptoBreve | Notícia rápida, briefing enxuto | Editorial imediato; menos ligado a pesquisa longa | Não validado |
| CriptoFato | Checagem e rigor jornalístico | Descritivo e editorial; chance de colisão | Não validado |

**Observação de triagem pública exploratória:** pesquisas gerais não mostraram uma marca jornalística dominante usando o nome exato **CriptoPauta** ou **CriptoSonda** nos resultados examinados. Isso **NÃO** comprova inexistência, domínio livre, conta social livre ou aptidão para registro. A busca exaustiva no INPI, inclusive por radicais e classes, não foi concluída.

### 22.3 Nomes que devem ser evitados no curto prazo

- **CriptoRadar:** já há um portal brasileiro usando o mesmo nome (`https://criptoradar.com.br/sobre/`).
- **CriptoFarol:** já há uso público ligado a cripto e domínio `.com.br`; além de "Farol Cripto" no mercado.
- **CriptoVox:** perfis/empresa e domínio relacionados ao nome já aparecem publicamente.
- **CriptoLume:** a expressão próxima **Cryptolume** aparece no setor cripto, representando risco de semelhança a investigar.
- **CriptoNorte:** uso público anterior em redes e outros sites.

Fontes de colisões indicativas:
- https://criptoradar.com.br/sobre/
- https://www.scamadviser.com/check-website/criptofarol.com.br
- https://www.farolcripto.com.br/matriculas-6
- https://br.linkedin.com/in/ederson-d-rolon (pesquisar marca/empresa Cryptovox separadamente)

### 22.4 Sugestão de assinatura editorial [NÃO APROVADA]

- **CriptoPauta:** "O mercado cripto, com contexto." ou "O que acontece. O que importa."
- **CriptoSonda:** "A notícia além da manchete." ou "Investigamos para você entender."
- **CriptoMira:** "Foco no que move o mundo cripto." ou "Notícias no ponto certo."

### 22.5 Checklist de validação antes de escolher e comprar domínio

- [ ] Consultar **INPI** por nome exato, variações ortográficas, fonéticas, radical e marcas próximas em classes relevantes, incluindo publicação de conteúdo e plataformas digitais; avaliar possibilidade de oposição/confusão.
- [ ] Verificar domínio `.com.br` (Registro.br), `.com` (registrador e RDAP oficial), grafias próximas e possíveis homônimos; **não inferir disponibilidade por ausência de página**.
- [ ] Verificar handles reais no X, Instagram, Telegram, YouTube e outras redes, e semelhanças com contas existentes.
- [ ] Fazer busca global por marca/nome, notícias, aplicativos, empresas e registros; registrar data, evidências e screenshots/links.
- [ ] Verificar viabilidade de marca nominativa e logotipo com profissional habilitado se necessário.
- [ ] Escolher apenas **após aprovação expressa** do responsável pelo projeto; registrar ADR, nome de repositório, domínios e arquitetura de identidade.

**Status histórico da v0.2:** naquele momento nenhum nome estava escolhido. **Atualização v0.6:** o usuário selecionou **CoinBlink** como marca de trabalho; domínios, redes, clearance e registro permanecem pendentes.

**Consulta oficial:** https://servicos.busca.inpi.gov.br/marcas e https://www.gov.br/inpi/pt-br/servicos/marcas/guia-basico

---

## 23. NAMING — SEGUNDA RODADA: 20 NOMES NOVOS E TRIAGEM PÚBLICA (08/10/2026)

> **Pedido do responsável:** gerar mais 20 nomes memoráveis, associados imediatamente a criptomoedas, pesquisar colisões e manter o Master atualizado. **Este é um estudo criativo e exploratório, não uma liberação jurídica.** Os 20 nomes abaixo não repetem os 12 candidatos da primeira rodada (§22.2). A ausência de resultado em buscador **não comprova exclusividade**.

### 23.1 Metodologia, critérios e limites

- Buscas exploratórias na web em 08/10/2026 por grafia exata (com e sem acentos quando necessário), alternativas `Crypto`/`Cripto` em casos prioritários e indícios de uso por sites, comunidades, perfis, empresas e projetos.
- Resultados filtrados por **colisão direta**, **colisão semelhante/risco** e **nenhuma colisão relevante identificada nesta amostra**. Nomes sem correspondência visível permanecem **PENDENTES**, não `DISPONÍVEIS`.
- Não foi realizada consulta jurídica conclusiva ao INPI, verificação formal por RDAP/Registro.br, disponibilidade garantida de @handle no X ou auditoria global de marcas e fonética. Evitar nomes que imitem agentes financeiros, portais existentes ou marcas consolidadas.
- Critérios históricos de v0.3: pronúncia em português. **Da v0.4 em diante:** priorizar nome inglês global, associação evidente com cripto, jornalismo e pesquisa, caracteres simples para URL, memorização em `en`, `pt-BR` e `es`, identidade editorial e distinção visual.

**Legenda:** 🟢 *Sinal público preliminar favorável* = nenhuma colisão relevante localizada nesta rodada, **não equivale a livre**; 🟡 *Atenção* = sem evidência direta conclusiva ou conflito semântico/segmento; 🔴 *Evitar por enquanto* = uso relevante identificado no setor ou risco de confusão apreciável.

### 23.2 Vinte propostas inéditas nesta rodada

| # | Candidato | Conceito para o portal | Triagem pública em 08/10/2026 | Próximo passo |
|---:|---|---|---|---|
| 01 | **CriptoCerne** | O cerne de cada notícia, sem ruído | 🟢 Sem colisão relevante localizada na amostra | Prioridade de clearance |
| 02 | **CriptoNarra** | Jornalismo que conta e explica acontecimentos | 🟢 Sem colisão relevante localizada na amostra | Prioridade de clearance |
| 03 | **CriptoAvista** | Enxergar cedo o que importa no setor | 🟢 Sem colisão relevante localizada na amostra | Prioridade de clearance |
| 04 | **CriptoEstalo** | Notícias urgentes + contexto rápido | 🟢 Sem colisão relevante localizada na amostra | Avaliar se soa sério o bastante |
| 05 | **CriptoPivô** | O ponto de virada de cada acontecimento | 🟢 Sem colisão relevante localizada na amostra | Pesquisar `CryptoPivot` e marcas semelhantes |
| 06 | **CriptoTraço** | Linha editorial concisa, notícias originais | 🟢 Sem colisão relevante localizada na amostra | Teste de pronúncia e domínio `criptotraco` |
| 07 | **CriptoÂngulo** | Vários ângulos de uma notícia | 🟢 Sem colisão relevante localizada na amostra | Checar `criptoangulo` e fonética |
| 08 | **CriptoEixo** | Entender o centro do mercado | 🟢 Sem colisão relevante localizada na amostra | Cautela com marcas financeiras `Eixo` |
| 09 | **CriptoTinta** | Identidade de jornal e editorial | 🟡 Aparece como expressão literal em textos não setoriais | Checar homônimos e clareza do significado |
| 10 | **CriptoTimbre** | Voz editorial reconhecível | 🟢 Sem colisão relevante localizada na amostra | Testar memorabilidade com leitores |
| 11 | **CriptoDobra** | O que existe além da manchete | 🟢 Sem colisão relevante localizada na amostra | Testar compreensão do nome |
| 12 | **CriptoZelo** | Cuidado com fatos e qualidade | 🟢 Sem colisão relevante localizada na amostra | Testar associação com notícias |
| 13 | **CriptoVértice** | Interseção entre fatos e mercado | 🟢 Sem colisão relevante localizada na amostra | Checar `criptovertice` e pronúncia |
| 14 | **CriptoLousa** | Explicação fácil e educação cripto | 🟢 Sem colisão relevante localizada na amostra | Pode parecer mais escola que jornal |
| 15 | **CriptoPrumo** | Precisão, equilíbrio editorial | 🔴 `Prumo` aparece em plataforma de IA para trading e há marcas financeiras semelhantes | Despriorizar antes de avaliação jurídica |
| 16 | **CriptoPulso** | Batimento das notícias do mercado | 🔴 `CryptoPulse` já nomeia veículos de notícias e canais do mesmo setor | Evitar |
| 17 | **CriptoRastro** | Investigar o caminho dos acontecimentos | 🔴 Grupo/comunidade `CriptoRastro` encontrado em cripto P2P | Evitar |
| 18 | **CriptoLupa** | Análise de fatos nos mínimos detalhes | 🔴 Perfil homônimo ligado a cripto/notícias/consultoria | Evitar |
| 19 | **CriptoNauta** | Explorar o universo de blockchains | 🔴 `Criptonauta` já utilizado em comunidade e em iniciativas do setor | Evitar |
| 20 | **CriptoFólio** | Folio editorial e notícias organizadas | 🔴 `CryptoFolio`/`Kriptofolio` já associados a canais e apps cripto | Evitar |

**Interpretação importante:** foram pesquisadas grafias específicas, não foi realizada certificação global de unicidade de cada variante. Um futuro registro/compra dependerá de validação formal. Os seis candidatos com `🔴` ficam documentados como **não recomendados para a escolha imediata**.

### 23.3 Shortlist da rodada v0.3 [NÃO APROVADA]

**Critérios subjetivos desta proposta (não são notas de benchmark):** clareza de produto, personalidade de mídia, memorização, originalidade editorial e resultado das buscas exploratórias.

1. **CriptoCerne** — *"O essencial por trás da notícia."* Diferente de uma página de cotação, posiciona o veículo como fonte que vai ao núcleo do assunto. **Favorito novo**, condicionado a clearance.
2. **CriptoNarra** — *"O mundo cripto, bem explicado."* Voz jornalística, forte para newsletter e artigos didáticos. **Favorito alternativo**.
3. **CriptoAvista** — *"Enxergue o que importa."* Apropriado para Radar 24h, novos acontecimentos e distribuição no X. **Favorito alternativo**.
4. **CriptoPivô** — *"O ponto de virada das notícias cripto."* Compacto, boa identidade tecnológica; merece pesquisa fonética e internacional.
5. **CriptoTraço** — *"Notícias com contexto e clareza."* Editorial e desenhável em logo; não tão imediatamente associado a hard news quanto `CriptoNarra`.

**Preservar alternativas anteriores:** `CriptoPauta`, `CriptoSonda` e `CriptoMira` permanecem candidatos históricos (§22). A nova rodada **não revoga** as preferências anteriores e **não decide** nome comercial.

### 23.4 Evidências de colisão consultadas

| Nome afetado | Evidência pública encontrada | URL para revisão | Leitura |
|---|---|---|---|
| CriptoPulso / CryptoPulse | CryptoPulse.News declara atuação como mídia de notícias cripto; outros domínios `CryptoPulse` atuam no setor | https://cryptopulse.news/about/ ; https://cryptopulse.com/ | Forte conflito de segmentação/memorização, não usar |
| CriptoPrumo / Prumo | Existe produto `Prumo` de IA para trading; serviços públicos de espelho de marcas apresentam pedidos e registros `PRUMO` no segmento financeiro | https://www.theprumo.com/ ; https://trademarkiq.com.br/marca/BR500000944888232 | Risco de similaridade, exige consulta oficial ao INPI |
| CriptoRastro | Diretórios públicos referem grupo Telegram `CriptoRastro` de comércio P2P cripto | https://www.amigosmadrid.es/grupos-telegram/3 | Indício de uso do nome no próprio setor |
| CriptoLupa | Perfil `@CriptoLupa` descrito como consultoria cripto com notícias/investigação em agregador de perfis | https://www.instalker.org/DisfrutaConRIL | Evidência indireta; confirmar na plataforma primária se necessário |
| CriptoNauta / Criptonauta | Repositório `Portal Criptonauta` e publicação NovaDAX com personagem `Criptonauta` | https://gitlab.com/criptonautas/portal-criptonauta ; https://pt.linkedin.com/posts/novadax-do-brasil_criptonauta-novadax-criptomoedas-activity-7219773212648230914-Kzq6 | Colisão fonética forte no setor |
| CriptoFólio / CryptoFolio | Canal CryptoFolioES mencionado em podcast; variantes Kriptofolio / CryptFolio existem em aplicativos de gestão de criptomoedas | https://www.podcasts-online.org/pt/lo-de-las-criptos-podcast-de-criptomonedas-1565590584 ; https://play.google.com/store/apps/details?id=com.baruckis.kriptofolio | Colisão temática e gráfica relevante |
| CriptoTrama [não escolhido] | Expressão idêntica usada em outras áreas (inclusive jogo) | https://news.blizzard.com/es-mx/article/20581817/notas-del-parche-del-rpp-de-heroes-of-the-storm-6-de-marzo-de-2017 | Não classifica como conflito comercial cripto; apenas alerta de unicidade |

**INPI oficial e domínio:**
- INPI — https://servicos.busca.inpi.gov.br/marcas e https://www.gov.br/inpi/pt-br/servicos/marcas/guia-basico
- Registro.br — https://registro.br/
- Consulta ICANN — https://lookup.icann.org/en

### 23.5 Gate de decisão e Work Order futuro

- **Passo A:** selecionar até três finalistas preliminares com aprovação expressa do responsável.
- **Passo B:** consulta formal nominativa, variantes fonéticas/radicais e classes pertinentes no INPI; checar potenciais conflitos no Brasil e, se necessário, exterior.
- **Passo C:** consultar disponibilidade real `.com.br`/`.com`, redes sociais e variações; guardar evidências verificáveis com data e fonte.
- **Passo D:** validar nome com cinco a dez potenciais leitores (pronúncia, digitação e recordação espontânea). Isso será pesquisa de UX futura, **não foi executada**.
- **Passo E:** somente então aprovar marca, comprar domínio, registrar ADR de identidade e planejar logo/design. **Nenhum desses atos foi realizado nesta atualização.**

**Escopo:** descoberta de nome e pesquisa inicial são planejamento; não exigem implementação, custos de domínio ou novos módulos. DeepSeek e JEV, a arquitetura, os critérios de qualidade e os orçamentos iniciais permanecem **inalterados**.

---

## 24. DECISÃO DE PRODUTO — ENGLISH-FIRST + PORTUGUÊS E ESPANHOL DESDE O INÍCIO (08/10/2026)

### 24.1 Contrato de idiomas [ESCOLHA DO USUÁRIO]

| Campo | Valor | Status |
|---|---|---|
| Idioma principal e canônico de reportagem | `en` — inglês internacional | ESCOLHA DO USUÁRIO |
| Idioma secundário 1 | `pt-BR` — português brasileiro | ESCOLHA DO USUÁRIO |
| Idioma secundário 2 | `es` — espanhol internacional | ESCOLHA DO USUÁRIO |
| Identidade e nome comercial | **Uma marca em inglês** para todas as versões | ESCOLHA DO USUÁRIO |
| Idioma da documentação canônica de novos projetos | Inglês; este Master histórico segue em português | PROPOSTA DE ENGENHARIA |
| Idioma de relatórios/auditoria para o responsável | Português brasileiro | Preferência operacional preexistente |

A identidade editorial de origem (fatos, apuração, evidências, revisão, texto principal) será em inglês. A interface, navegação, rotas, SEO e estrutura de conteúdo precisam suportar os **três idiomas desde o MVP**. A cobertura de notícias traduzidas será progressiva segundo valor editorial, custos e QA, mas nenhuma versão poderá fingir estar traduzida quando a matéria principal estiver em inglês.

### 24.2 Arquitetura de URLs e SEO internacional [PROPOSTA]

- Usar **uma única marca + domínio preferencialmente `.com`**, sujeito a clearance e registro real.
- Inglês (principal): `https://example.com/news/ethereum-upgrade` (domínio ilustrativo, não registrado).
- Português: `https://example.com/pt-br/news/ethereum-upgrade`.
- Espanhol: `https://example.com/es/news/ethereum-upgrade`.
- `en` → `hreflang="en"`; `pt-BR` → `hreflang="pt-BR"`; `es` → `hreflang="es"`; fallback `x-default` preferencialmente para raiz inglesa/landing de seleção.
- Declarar variantes com `<link rel="alternate" hreflang="...">` bidirecionais **apenas onde a matéria traduzida existe e está publicada**; canonical apontando para o **próprio URL em seu idioma** em artigos substancialmente traduzidos.
- Não redirecionar automaticamente visitantes com base em IP ou idioma do navegador; oferecer **seletor explícito e persistente durante a sessão**; fallback claro quando a matéria só existir em inglês.
- `html lang`, título, descrição, Open Graph, JSON-LD, breadcrumbs, labels, alt text e navegação precisam refletir o idioma da página.
- Não indexar variantes vazias, não concluídas ou com conteúdo principal sem tradução; sitemap e News sitemap somente com URLs válidos.
- O slug em inglês pode permanecer comum nos três idiomas no MVP (reduz complexidade de roteamento); SEO localizado dos slugs pode ser introduzido com redirect/alias estáveis mediante evidência.

**Documentação oficial consultada:**
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites

### 24.3 Contrato do pipeline editorial multilíngue [PROPOSTA]

1. Coletar e verificar fatos independentemente do idioma da fonte de descoberta.
2. Criar um **evento canônico** com evidências, fontes, timestamp UTC e `event_id` imutável.
3. JEV/regras determinísticas decidem `research`, `reject`, `hold`, `publish_en`, `localize_pt_BR`, `localize_es`, com limites e fallback tipados (não substituir verificação factual).
4. DeepSeek investiga/redige **uma versão original em inglês**; gate editorial verifica fatos, licenças e citações antes da publicação.
5. Só então, e mediante orçamento/critério editorial, criar versões `pt-BR` e `es`, preservando links, números, unidades, nomes próprios e distinção fato/opinião; permitir informações locais **somente se apuradas e atribuídas**.
6. Publicar cada tradução como variante do mesmo `event_id`, com versão, histórico editorial, status e revisão independentes por idioma.
7. Publicações no X: inglês como padrão; publicações localizadas somente em canais/perfis apropriados e quando valer o custo/risco de duplicação; seguir regras antispam.
8. Riscos de segurança, rumores, política regulatória e alegações que afetem mercados precisam de revisão e controle adicional **em todos os idiomas**; não traduzir automaticamente um artigo bloqueado.

Campos mínimos (proposta): `event_id`, `article_id`, `locale`, `source_locale`, `translation_of`, `status`, `review_status`, `published_at`, `updated_at`, `canonical_url`, `source_evidence_ids`, `model_version`, `translation_cost_usd`. `published_at` e `updated_at` são datas editoriais reais, não data de tradução inventada.

### 24.4 Custos, JEV e DeepSeek [PROPOSTA]

- **Não** fazer três pesquisas profundas para o mesmo acontecimento. Usar um `research_event` com evidências canônicas e textos por idioma quando autorizados.
- Cache por `(event_id, locale, revision, model)`; invalidar traduções após correção relevante na versão canônica e revalidar a alteração.
- Orçamentos separados para `ingestion`, `research_en`, `draft_en`, `review_en`, `translate_pt_BR`, `translate_es` e `localized_review`.
- Se não houver saldo ou evidência: **não fabricar tradução**; mostrar versão inglesa com aviso explícito, em vez de página falsa em português/espanhol.
- Medir desempenho: custo por **evento verificado**, por artigo em inglês e por idioma derivado; taxa de correções, latência de publicação por região e retenção por idioma.

### 24.5 Requisitos e testes de aceitação da internacionalização [NECESSARY]

- Interface básica navegável sem mistura de idiomas para `en`, `pt-BR` e `es`.
- Páginas com `hreflang` válidos e autorreferentes/bidirecionais **quando** variantes estiverem publicadas; canonical correto, sem soft-404 localizado.
- Conteúdo e editoria en-first com tradução condicional; fluxo de aprovação e bloqueio individual por idioma.
- Cobertura automatizada de roteamento, fallback, switcher, links, metadados e traduções ausentes; testes e2e em desktop e mobile.
- Preservar nomenclatura de moedas, unidades, datas, fuso horário e formatação regional, com fontes originais rastreáveis.
- Reviews de qualidade manual nos primeiros artigos PT/ES, antes de automatizar a localização com segurança.

**Impacto de escopo:** base trilíngue é NECESSARY por decisão explícita; tradução de **todo** o acervo para os três idiomas não entra automaticamente no DoD. A decisão anterior P-007 foi substituída nesta revisão; as antigas listas de nomes em português são histórico e não estão aprovadas.

---

## 25. NAMING GLOBAL — 20 NOVAS PROPOSTAS EM INGLÊS (08/10/2026)

### 25.1 Requisitos do nome [ESCOLHA DO USUÁRIO]

- **Nome em inglês**, ligado imediatamente a criptomoedas (`Crypto`, `Coin`, `Block`, `Chain`, `Token`).
- Memorizável, fácil de ler, escrever e pronunciar, com identidade única para inglês, português e espanhol.
- Transmitir mídia, reportagem, explicação, confiança e/ou radar de notícias, sem se confundir com corretora ou prometer lucros.
- Busca pública exploratória **não valida exclusividade jurídica**, disponibilidade de `.com`, ou perfil no X. Não comprar, implantar identidade ou registrar marca antes da aprovação e clearance.

### 25.2 Vinte candidatos [GERAÇÃO CRIATIVA; NÃO APROVADOS]

| # | Nome em inglês | Associação editorial | Nota de triagem preliminar |
|---:|---|---|---|
| 01 | **CryptoFacta** | Crypto + facts, curta e pronunciável em 3 idiomas | Candidato principal; requer clearance completo |
| 02 | **CoinFacta** | Facts about coins, fácil de lembrar | Candidato principal; confirmar usos relacionados a fintech |
| 03 | **BlockFacta** | Fatos de blockchain | Candidato secundário; marca pouco explícita sobre notícias |
| 04 | **ChainFacta** | Inteligência verificável de redes e tokens | Candidato secundário; conferir marcas de tecnologia |
| 05 | **TokenFacta** | Fatos e explicações sobre tokens | Candidato secundário; pode estreitar percepção para tokens |
| 06 | **BlockNarra** | Narrar histórias da blockchain | Candidato principal; marca editorial e internacional |
| 07 | **ChainNarra** | Narrativas explicadas de Web3 | Candidato secundário; menos associação imediata a notícias |
| 08 | **CryptoFactwire** | Serviço de notícias cripto com foco nos fatos | Candidato principal; um pouco mais longo |
| 09 | **CryptoBriefline** | Resumo editorial rápido e contextualizado | Candidato principal; comunicação muito clara |
| 10 | **CryptoNewsforge** | Redação que investiga e constrói reportagem original | Candidato principal; identidade tecnológica forte |
| 11 | **CryptoStorydesk** | Mesa editorial de reportagens cripto | Candidato secundário; impressão de redação profissional |
| 12 | **CryptoSignalroom** | Sinais informativos e inteligência, não trading | Candidato secundário; possível associação a trade |
| 13 | **CryptoProofline** | Apuração e verificação de fontes | Candidato secundário; provar fatos sem prometer certeza absoluta |
| 14 | **CryptoClearwire** | Notícias claras e bem explicadas | Candidato principal; associação imediata ao produto |
| 15 | **CryptoEventwire** | Cobertura de eventos relevantes de mercado | Candidato secundário; pode limitar a marca a breaking news |
| 16 | **CryptoNorthline** | Direção e contexto no mercado cripto | Candidato secundário; associação menor a jornalismo |
| 17 | **BlockBriefline** | Resumo de notícias de blockchains | Candidato secundário; menos amplo que Crypto |
| 18 | **ChainBriefline** | Briefings de on-chain e Web3 | Candidato secundário; nome mais técnico |
| 19 | **BlockStorywire** | Reportagens sobre eventos da blockchain | Candidato secundário; comprimento maior |
| 20 | **CoinFactline** | Jornalismo factual sobre criptomoedas | Candidato principal; conferir similaridade fonética |

**Escopo real da pesquisa:** buscas exploratórias por frases exatas e por variantes temáticas foram efetuadas em motores públicos. Não houve revisão exaustiva de cada combinação, jurisdição, domínio, perfil ou classe de marca; **NENHUM** dos 20 nomes está liberado para uso comercial. Alguns nomes pareceram sem concorrente homônimo evidente na amostra; isso é apenas ausência de evidência, **não** evidência de exclusividade.

### 25.3 Nomes pesquisados e não recomendados (colisões encontradas)

| Nome pesquisado | Evidência pública de uso | Estado |
|---|---|---|
| `CryptoDepth` | Portal editorial de cripto em `https://cryptodepth.io/`; pesquisa em `https://crypto-depth.com/` | **EVITAR**: colisão direta no setor |
| `CryptoSift` | Uso em extensão para criptomoedas e perfis cripto publicamente indexados | **EVITAR**: colisão relevante |
| `CryptoVerity` | Perfil público `Crypto Verity` na Binance Square e uso anterior da grafia em redes | **EVITAR**: colisão relevante |
| `CryptoPulse` | Portais existentes de notícias cripto (já registrado em §23) | **EVITAR**: colisão relevante |

**Referências de triagem:**
- https://cryptodepth.io/
- https://crypto-depth.com/
- https://in.linkedin.com/in/vedantkokane
- https://www.binance.com/en/square/profile/coinmaketcap/
- https://cryptopulse.news/about/

### 25.4 Shortlist da rodada inglesa [PROPOSTA, NÃO APROVADA]

1. **CryptoFacta** — *"Crypto news. Facts first."* Identificação rápida do setor, memorável e pronunciável nos três idiomas.
2. **CryptoNewsforge** — *"Beyond the headline."* Forte relação com jornalismo original e tecnologia, mas grafia maior.
3. **CryptoBriefline** — *"The crypto story, explained."* Ótimo para Radar e briefing diário, porém pode parecer exclusivamente resumo.
4. **BlockNarra** — *"The stories behind the chain."* Mais distintivo e conciso; requer tagline explícita `Crypto News`.
5. **CryptoFactwire** — *"The signal behind the story."* Posicionamento global de agência e fact-checking, embora mais longo.

**Favorito provisório desta rodada:** `CryptoFacta`, **sem aprovação do usuário e sem disponibilidade comprovada**. Não registrar domínio com base somente neste documento.

### 25.5 Gate de escolha definitiva

1. Reduzir a lista a até 3 nomes preferidos.
2. Pesquisar marcas e similares no **INPI** e mercados-alvo prioritários (por exemplo, **USPTO** / **EUIPO**, se pertinentes), incluindo grafias, fonética e classes de mídia/publicidade/tecnologia.
3. Verificar `.com`, `.news`, `.io` e perfis `@` diretamente em registradores/plataformas com registros das consultas (sem presumir que DNS ou ausência no buscador prova disponibilidade).
4. Testar compreensão imediata da categoria "crypto news" em inglês, português e espanhol; eliminar ambiguidades financeiras e potenciais conflitos com terceiros.
5. Somente após aprovação expressa, consolidar nome, domínio, slogan, logo e ADR da identidade no Source Pack.

---

## 26. NAMING — NOMES CURTOS, COMUNS E VISUAIS (08/10/2026)

### 26.1 Critério atualizado [ESCOLHA DO USUÁRIO]

- **Inglês** como idioma principal da marca (sem localização do nome). Interface e redação canônica em `en`, com `pt-BR` e `es` secundários; esta decisão **não muda**.
- Buscar nomes na linha de **CryptoPanic**: juntar **palavras inglesas comuns**, poucas sílabas, fácil de dizer, digitar, memorizar e identificar com o universo cripto.
- Evitar construções longas ou inventadas como `CryptoNewsforge`, `CryptoBriefline` e `CryptoFacta`, que passam a constar somente no histórico de brainstorming (não rejeitadas juridicamente, mas menos alinhadas à preferência atual).
- Cada candidato finalista precisa oferecer: **ícone reconhecível em 24px**, wordmark, paleta de cores, favicon, avatar do X, selo Breaking/Verified, templates de social cards, identidade editorial de um portal profissional.
- **Status:** triagem preliminar em pesquisa pública. 'Sem colisão exata óbvia na amostra' NÃO significa exclusividade, `.com` disponível, handle livre ou marca registrável. Nenhum registro foi solicitado.

### 26.2 Candidatos com palavras do cotidiano [PROPOSTAS, NÃO APROVADOS]

| Candidato | Ideia simples | Símbolo imediato | Colisão/risco preliminar |
|---|---|---|---|
| **CoinBlink** | Um piscar de olhos para entender cripto | Um olho geométrico formado por anel de moeda e flash | Não apareceu uso comercial exato relevante na amostra; existe a marca **Coinwink**, de alertas cripto, com proximidade fonética. **Exige comparação de marcas e fonética.** |
| **CryptoBeep** | Um alerta da notícia importante | Arcos de sinal/notification beacon formando um `C` | Uso exato prévio em projeto Devpost e perfis antigos: **colisão identificada**; potencial reduzido até clearance. |
| **CoinTock** | Notícias cripto no ritmo do mercado | Disco-relógio minimalista com traço digital | Já existem `@cointock` e a grafia **CoinTok / Cointok** no universo cripto. **Risco de confusão fonética/ortográfica.** |
| **ChainBeep** | Alerta do universo blockchain | Dois elos com ondas de aviso | Sem colisão comercial exata evidente na amostra, mas é necessário clearance. Associação com notícias menos explícita; incluir `Crypto News` na tagline. |
| **BlockJolt** | Energia para notícias de blockchain | Bloco atravessado por raio simples | Canal existente no YouTube chamado BlockJolt; collision digital identificada. |
| **CoinChirp** | Notícias rápidas com tom de conversa | Pássaro geométrico ou balão sonoro em forma de moeda | Nome usado em perfil social; exige revisão de handles e confusão potencial com redes. |
| **CoinHush** | Separar ruído de fatos | Balão de conversa recortado por círculo de moeda | Sem uso comercial exato evidente na amostra; `hush` pode transmitir silêncio/segredo, validar semântica. |
| **BlockWink** | Um olhar rápido para os fatos | Bloco com recorte de olho | Sem uso comercial exato evidente na amostra; remete menos diretamente a cripto para iniciantes. |
| **CoinBop** | Notícias acessíveis, de ritmo rápido | Disco/moeda com onda sonora | Sem uso comercial exato evidente na amostra; tom casual demais para reportagens técnicas ou crises. |
| **BlockScoop** | O furo de reportagem da blockchain | Lupa + página de jornal / dobra em `B` | Existe BlockScoop GmbH: colisão nominal corporativa, contexto setorial a apurar. |
| **CryptoRoar** | Manchetes fortes e marcantes | Cabeça de leão em negativo / ondas de voz | Uso de CryptoRoar como perfil emissor de conteúdo em plataformas cripto; colisão social existente. |
| **CoinFlick** | Um gesto para ver a notícia | Moeda em movimento | App CoinFlick existente; colisão exata. |

**Candidatos retirados por colisões diretas no mesmo setor ou sobreposição muito clara:** `CoinScoop` (portal de notícias cripto), `CoinPulse` (portais de notícias), `CryptoWire` (serviços de notícia), `CryptoPop` (marcas e site), `CoinPop` (produto/mídia cripto e advertência financeira de um homônimo), `CoinSiren` (portal de notícias/dados cripto), `CoinBlast` (portal cripto), `CryptoPing` (token cripto), `BlockBuzz` (agência Web3), `CoinBeam` (plataforma de serviços financeiros cripto), `CoinNudge` (pesquisa/alertas cripto), `CryptoBite` (site cripto e nome em alerta de regulador estrangeiro). Não usar no projeto sem análise aprofundada; no planejamento, preferir alternativas.

### 26.3 Três conceitos de identidade [PROPOSTAS, NÃO APROVADAS]

**A. CoinBlink — principal candidato criativo, sujeito a clearance**
- **Tagline:** `Crypto news in a blink.`
- **Logo:** símbolo original, círculo de moeda interrompido por um traço luminoso, criando olho/flash (não reproduzir o logo Coinwink).
- **Paleta proposta:** `#0D1117` (grafite quase preto), `#F5F7FA` (branco), `#B8F34B` (lime editorial), `#657081` (cinza metálico).
- **Estética:** jornal financeiro global, tipografia condensada para manchetes, interface limpa com Radar 24h discreto; verde-lime somente nos destaques, sem visual de cassino.
- **Pacote visual:** favicon = olho/anel; breaking cards = pequeno pulso; verified = check dentro do anel; banner X = manchete + linha de impacto; movimento de blink subtil, respeitando prefers-reduced-motion.
- **Risco:** Coinwink atua em alertas de cripto; comparar marcas, grafia, sons, símbolos, produtos e mercados-alvo antes de aprovar.

**B. CryptoBeep — associação imediata ao setor e a alertas (colisão prévia)**
- **Tagline:** `Hear it first. Understand it better.`
- **Logo:** `C` geométrico com duas ondas radiais, mantendo legibilidade em favicon minúsculo; sem marca copiada.
- **Paleta proposta:** `#0B1017`, `#FF625C` (coral elétrico), `#E9EDF2` (off-white), `#4B5563` (cinza).
- **Estética:** breaking news acessível, alertas visuais integrados à home, detalhes sonoros opcionais e DESLIGADOS por padrão.
- **Risco:** já existe projeto antigo com nome CryptoBeep; não presumir que pode ser registrado.

**C. CoinTock — breve, temporal, bom ícone (colisão de grafia semelhante)**
- **Tagline:** `Every moment in crypto.`
- **Logo:** moeda-relógio com ponteiro formando um gráfico; evitar aparência de app de trading ou relógio genérico.
- **Paleta proposta:** `#111315` (carbono), `#27D7B3` (verde-água), `#F1F5F9`, `#64748B`.
- **Estética:** notícias organizadas em linha do tempo, contadores discretos e cronologia de matérias; interfaces leves e profissionais.
- **Risco:** CoinTok/Cointok e uso @cointock. Testar confusão visual/sonora.

### 26.4 Estado da decisão [ATUALIZADO NA v0.6]

- **Nome preferido/de trabalho escolhido pelo usuário:** **CoinBlink**. Passa a ser a referência nominal em planejamento, documentação futura e propostas de UX; isso **não** confere exclusividade nem aprovação jurídica/comercial.
- **Marca registrada, domínio, perfis sociais, identidade visual final:** **PENDENTES**. Nenhuma disponibilidade de domínio, exclusividade ou registro foi confirmada e nenhuma aquisição foi feita.
- **Shortlist secundária arquivada:** CryptoBeep, CoinTock, ChainBeep e CoinHush permanecem apenas como opções de contingência em caso de bloqueio na pesquisa de marca.
- **Próximo gate:** verificar homônimos e semelhantes (com atenção a **Coinwink**) em USPTO, EUIPO, INPI e jurisdições de interesse; domínios com registradores, perfis X/Instagram/YouTube, fonética e risco de confusão nos três idiomas. Depois escolher definitivamente domínio, logo e guidelines e registrar ADR, antes de ações comerciais.

### 26.5 Evidências públicas da triagem (URLs, não prova de exclusividade)

- Coinwink (marca próxima): https://coinwink.com/
- CryptoBeep (projeto homônimo): https://devpost.com/software/cryptobeep
- CoinTock/Cointok (variante próxima): https://bitcointalk.org/index.php?topic=5418100.40
- BlockJolt (YouTube): https://www.youtube.com/@blockjolt
- BlockScoop GmbH: https://tracxn.com/d/legal-entities/germany/blockscoop-gmbh/__A-ATCNpVVkr3OyQC_hu9PBKYc54hqvHDTZ5ydY8Nn3c
- CoinFlick (app): https://coinflick.app/
- CryptoRoar (uso social cripto): https://www.kucoin.com/news/community/BTC/69b1d35da5b0db0007df5c3f
- CoinScoop (portal): https://coinscoop.org/
- CoinPulse (portal): https://coinpulsehq.com/newsroom/
- CryptoWire (portal): https://cryptowire.ai/
- CoinPop (mídia): https://coinpopbit.com/pt/
- CryptoPop (portal): https://cryptopop.net/
- CoinSiren (portal): https://coinsiren.io/news
- CoinBlast (portal): https://coinblast.co/
- CryptoPing (token): https://coinmarketcap.com/pt-br/currencies/cryptoping/
- BlockBuzz (agência): https://www.blockbuzz.co/
- CoinBeam (serviços de cripto): https://www.linkedin.com/company/coinbeam
- CoinNudge (alertas cripto): https://coinnudge.site/
- CryptoBite (portal): https://cryptobite.co/cryptocurrency/


### 26.6 Briefing de identidade CoinBlink [PROPOSTA PARA DESIGN]

| Elemento | Diretriz | Estado |
|---|---|---|
| Brand name | **CoinBlink** (único para `en` / `pt-BR` / `es`) | ESCOLHA DO USUÁRIO, sujeito a clearance |
| Brand category | Crypto news, explainers and independent market context | POSICIONAMENTO PROPOSTO |
| Tagline | `Crypto news in a blink.` | PROPOSTA |
| Wordmark | `CoinBlink`, sem depender da tipografia de terceiros e sem confusão com Coinwink | PROPOSTA |
| Icon | Moeda/anel e olhar/flash em monograma abstrato original | PROPOSTA |
| Primary UI | `#0D1117`, `#F5F7FA`, `#657081` | PROPOSTA |
| Accent | `#B8F34B`, uso pontual e acessível | PROPOSTA |
| Social template | Foto/ilustração própria, manchete curta, fonte, selo de evidência e URL oficial do portal | PROPOSTA |
| Motion | Blink breve somente em estados decorativos, com redução de movimento | PROPOSTA |
| Navigation languages | `en` (canônico), `pt-BR`, `es` | ESCOLHA DO USUÁRIO |

**Critérios antes de aprovar identidade:** (1) clearance jurídico e digital; (2) pelo menos três conceitos de símbolo, comprovadamente originais; (3) teste de legibilidade 16/24/32 px e mobile; (4) contraste WCAG; (5) identidade consistente entre site, thumbnail de notícias, perfil X e banners; (6) validação editorial para que o nome não induza falsa ideia de consultoria/trading.

**Fora do escopo desta atualização:** compra de domínio, criação de logo final, criação de repositório, desenvolvimento, integração de APIs, publicação no X e lançamento. Nenhuma dessas ações foi executada.

---

## 27. CHANGELOG DO MASTER

### v0.6.0 — 08/10/2026

- **Escolha do usuário:** CoinBlink passa a ser o nome preferido e a marca de trabalho do portal internacional.
- Atualizadas identificação, direção de marca, status de naming, pendências e P-017; registrado P-020 para a proposta de identidade visual.
- Formalizado briefing preliminar de logo, paleta, tagline e consistência nos idiomas `en`, `pt-BR` e `es`.
- **Pendências mantidas:** possível colisão/confusão com Coinwink, consulta de marcas, domínios e perfis; nenhuma exclusividade afirmada.
- Preservados o histórico de alternativas e todo o planejamento DeepSeek + JEV, fontes, orçamento, redação, audiência, monetização e governança.

### v0.5.0 — 08/10/2026

- Atualizado o critério explícito do usuário: marcas inglesas curtas, com termos comuns e ícones visualmente distintivos, na linha conceitual de CryptoPanic.
- Consolidada a nova pesquisa pública de candidatos, riscos de colisões e nomes desaconselhados; sem aprovação de marca/domínio.
- Descritos três conceitos de identidade completos (logo, slogan, paleta, elementos editoriais e alertas).
- Preservada a decisão English-first e suporte a `pt-BR` / `es` desde a fundação, bem como todos os módulos, decisões técnicas e material anterior.

### v0.4.0 — 08/10/2026

- **Decisão explícita do usuário:** inglês (`en`) é o idioma editorial principal; `pt-BR` e `es` serão secundários com suporte desde a arquitetura inicial.
- Substituída a hipótese histórica P-007 (`pt-BR` primeiro e tradução depois); versões antigas preservadas para rastreabilidade.
- Incluídos contratos de URL/i18n/l10n, SEO `hreflang`, tradução com DeepSeek e seleção orçamentária via JEV; definido escopo base NECESSARY vs expansão progressiva.
- Criadas 20 propostas de marcas em inglês e anotadas colisões identificadas; shortlist global ainda NÃO APROVADA.
- Preservado integralmente o planejamento original de APIs, redação, audiência, X, SEO, monetização e Work Orders.

### v0.3.0 — 08/10/2026

- Geradas 20 novas propostas de nome, sem repetir os 12 candidatos da rodada v0.2.
- Pesquisadas colisões em buscas públicas, com seis nomes despriorizados e evidências/links auditáveis.
- Adicionada shortlist alternativa (`CriptoCerne`, `CriptoNarra`, `CriptoAvista`), sem oficializar marca.
- Preservados integralmente os módulos, decisões preliminares, backlog de audiência, JEV/DeepSeek, APIs, monetização e calendário v0.2.
- Atualizado o gate de decisão de nome, domínio e INPI, sem ações externas ou alegações de disponibilidade.

### v0.2.0 — 08/10/2026

- Preservado integralmente o plano inicial de portal cripto, APIs, ingestão, cotas, DeepSeek, JEV, qualidade editorial, monetização e engenharia.
- Registradas as 15 funcionalidades propostas para audiência, priorização e sua relação com o DoD.
- Acrescentados canais de aquisição/distribuição, home conceitual, Audience Intelligence Engine e métricas.
- Incluída shortlist de marca com candidatos, colisões públicas e checklist de clearance legal/digital.
- Reforçado que brainstorm **não aprova** automaticamente implementação, gastos ou publicação sensível.

### v0.1.0 — 08/10/2026

- Primeira consolidação de ideias e proposta do portal (aprox. 700 linhas).


*Fim do Master de Ideias v0.6.0.*