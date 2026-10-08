# COINBLINK — VISUAL DESIGN BIBLE

> **Documento canônico de design e experiência visual | v1.0.0 | 2026-10-08**  
> **Idioma desta especificação:** português brasileiro; **idioma primário do produto:** inglês (`en`); secundários: `pt-BR`, `es`.  
> **Status:** `DESIGN REFERENCE APPROVED BY USER` · `IMPLEMENTATION NOT STARTED` · `VISUAL QA PENDING`  
> **Projeto:** CoinBlink, portal global de notícias e inteligência editorial sobre criptomoedas.  
> **Autoridade:** decisão expressa do usuário quanto à imagem da home, ao logo e à fidelidade obrigatória.  
> **Documentos relacionados:** `PORTAL_CRIPTO_MASTER_IDEIAS_v0.6.md` (ideias/produto, histórico existente).  
> **Futuro local sugerido no repositório:** `docs/design/COINBLINK_VISUAL_DESIGN_BIBLE.md`.

**Declaração de objetivo:** reproduzir a home aprovada no arquivo `assets/reference/coinblink-home-master-dark-1536x864.jpg` com fidelidade excepcional em composição, proporções, hierarquia, identidade, textura, luz, ícones, conteúdo demonstrativo e microinterações, **sem** sacrificar a semântica HTML, a acessibilidade, o desempenho, a responsividade, a segurança ou o funcionamento verdadeiro dos componentes.

**Não negociar:** esta não é uma inspiração genérica. É a referência visual mestra. Trocar layout, transformar o portal em um template genérico, escolher outra paleta, aumentar arbitrariamente margens, substituir o hero por uma área vazia, remover o Radar 24h, ou simplificar os cards sem aprovação significa **divergência de design**.

---

## 0. Leia isto antes de implementar

### 0.1 Hierarquia de autoridade

1. **Decisões aprovadas e checkpoint do repositório**, assim que ele existir.
2. **Imagem mestra da home**, fornecida e escolhida pelo usuário, para fatos *visuais* específicos.
3. **Logo aprovado**, também fornecido pelo usuário, para identidade e proporções do símbolo.
4. Esta Design Bible, que interpreta e especifica as referências sem substituí-las.
5. Design Tokens/arquivos CSV auxiliares gerados deste documento.
6. Pesquisa de bibliotecas, opiniões e convenções estéticas externas.

Se esta documentação divergir **visualmente** da imagem aprovada, corrigir a especificação, não modificar a referência. Se houver choque real com acessibilidade, segurança, desempenho, direitos, dados verdadeiros ou requisitos comerciais, documentar a divergência e submeter uma solução visual equivalente à aprovação. Não introduzir alteração silenciosa.

### 0.2 Estado das decisões (sem confundir desejo com evidência)

| ID | Assunto | Estado | Consequência |
|---|---|---|---|
| `CB-VIS-001` | Logo olho + moeda + raio, com lettering CoinBlink | **Aprovado visualmente pelo usuário** | Usar a imagem do logo como referência imutável; SVG ainda não produzido nem validado |
| `CB-VIS-002` | Home dark de 1536×864 exibida neste pacote | **Aprovado visualmente pelo usuário** | É o golden design de desktop |
| `CB-VIS-003` | Alta fidelidade, glassmorphism, motion e ícones SVG | **Requisito explícito** | Medir e provar; não apenas afirmar |
| `CB-VIS-004` | Inglês principal; português BR e espanhol secundários | **Aprovado para o produto** | i18n nasce na arquitetura |
| `CB-VIS-005` | Dark e light, usando dark como base visual | **Requisito explícito** | Light derivado, não inventar uma segunda marca |
| `CB-VIS-006` | Astro + React + TypeScript + Tailwind + Motion | **Proposta de stack visual** | Validar com arquitetura/Source Pack antes de congelar ADR |
| `CB-VIS-007` | Valores CSS, grid e timings numéricos deste documento | **Provisórios para calibração** | Ajustar somente com evidências de comparação visual |
| `CB-VIS-008` | Marca CoinBlink para uso comercial | **Clearance jurídico/digital pendente** | Não dizer que nome/logo estão registrados; verificar colisões, inclusive Coinwink |
| `CB-VIS-009` | Conteúdo/preços que constam da imagem | **Mock ilustrativo** | Não publicar como notícias, preços ou estatísticas atuais |

### 0.3 O que a Bíblia cobre

Inclui design visual da home desktop, sistema de identidade, raster-vs-vetor, detalhes de módulos, tokens, animações, estados, layout responsivo, equivalência light, internacionalização, acesso, SEO visual, assets, implementação front-end, testes de imagem e critérios de aprovação. **Não substitui** Requirements, Scope, Architecture, Security, Content Licensing, API Contracts, Deployment, DoD, Decisions Ledger, orçamento JEV/DeepSeek e Checkpoint que farão parte do Source Pack completo.

### 0.4 Escopo desta entrega

- **Produzido:** documentação de especificação e cópias exatas das duas referências visuais, mais recortes de inspeção e coordenadas aproximadas.
- **Não produzido:** código do site, SVG vetorial final, arquivo Figma editável, animações reais, renders separáveis, instalação de bibliotecas, deploy, PR, testes em navegador ou homologação de marca.
- **Importante:** nomes de pessoas, slogans publicitários secundários, números de audiência, valores de moedas, tempos e headlines no mockup são *dados de demonstração da imagem*. A estrutura visual é aprovada; as afirmações factuais não foram verificadas.

---

## 1. Arquivos, imutabilidade e rastreabilidade

### 1.1 Fontes visuais oficiais

| Arquivo | Papel | Dimensão | SHA-256 |
|---|---|---|---|
| `assets/reference/coinblink-home-master-dark-1536x864.jpg` | **GOLDEN HOME** | 1536×864 | `82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8` |
| `assets/reference/coinblink-logo-approved-original-1179x1040.jpg` | **GOLDEN LOGO** | 1179×1040 | `126cf0835f0edc95f4c512f2ceab9a14f8253c83a42670b2ccc412dc7d846ed0` |

Esses arquivos são **cópias byte a byte dos uploads do usuário**, sem reamostragem ou tratamento. Não sobrescrever. Para uma futura referência alterada, gerar arquivo novo com ID/versão e registrar aprovação explícita em ADR.

### 1.2 Referências segmentadas

`assets/reference/regions/` contém recortes numerados do próprio golden screenshot: header, hero, mercados, ticker, tendências, categorias, Radar 24h, sentimento, card promocional, artigos, newsletter, detalhes da arte, texto hero e logo no header. São **ajudas para análise**, não fontes alternativas de verdade.

`assets/reference/reference-regions.csv` contém as caixas em coordenadas de pixels, obtidas por inspeção visual. Essas medidas têm precisão **aproximada**; a implementação precisa refiná-las por screenshots e overlays. `assets/reference/SHA256SUMS.txt` auxilia a conferir integridade. `design-tokens.provisional.json` é um derivado **não canônico**.

### 1.3 Versão, naming e mudança controlada

- Golden file invariável: `coinblink-home-master-dark-1536x864.jpg`.
- Derivados temporários de medição: `experiments/`, não promover sem auditoria.
- Assets executáveis de produção (SVG/AVIF/WebP): `public/brand/` e `public/editorial/`, gerados e testados em Work Orders futuras.
- Toda mudança de cor, proporção, tipografia, timing ou ordenação requer evidência do desvio que resolve; registrar diferença no ledger visual.
- **Nunca** deixar o renderer apontar para a imagem inteira como fundo clicável para simular interface funcional.

---

## 2. Leitura visual detalhada da imagem aprovada

### 2.1 Direção artística

A imagem é um terminal editorial de notícias cripto com: fundo grafite quase preto, superfícies vítreas escuras, verdes-lima de emissão luminosa, informações financeiras legíveis, uma grande cena 3D dourada de Bitcoin, imagens editoriais de cartões compactos, gráficos finos verdes e ícones SVG coloridos por categoria. Visual premium e tecnicamente preciso, sem aparência de cassino, metaverso genérico ou painel administrativo branco.

**Palavras norteadoras:** precise · editorial · intelligent · premium · fast · credible · kinetic · crypto-native.

**Não usar:** gradientes arco-íris de IA, roxos generalizados, botões gigantes desproporcionais, tipografia serifada editorial no hero da referência, cards inflados com muito ar, bordas verde neon em todos os elementos, desfoque que apague texto, efeitos parallax intensos, animações em loop distraindo da leitura.

### 2.2 Hierarquia de primeira dobra

Ordem perceptual desejada:
1. Identificação da marca CoinBlink na extremidade superior esquerda.
2. Manchete e enorme cena Bitcoin de Breaking News no hero.
3. Tabela compacta de preços e pequenas linhas de tendência no painel direito.
4. Barra horizontal de ticker e faixa Trending Now.
5. Ícones de categorias.
6. Radar 24h, Market Sentiment e CTA ilustrado lado a lado.
7. Latest News e Newsletter na linha inferior.

Na referência desktop de **1536×864**, esses elementos aparecem juntos na tela. Não assumir que a home de produção terá exatamente a mesma altura para todos os idiomas e fontes; ainda assim **reproduzir a dobra de referência** no teste inglês de 1536×864.

### 2.3 Coordenadas observadas: caixas de referência

**Sistema:** origem `(0,0)` no canto superior esquerdo; coordenadas em pixels físicos do screenshot de referência; `x1/y1` exclusivos; medidas obtidas por inspeção e **sujeitas a calibração**.

| Região | x0 | y0 | x1 | y1 | Largura×altura aprox. |
|---|---:|---:|---:|---:|---:|
| Header/nav | 35 | 0 | 1502 | 61 | 1467×61 |
| Hero editorial | 44 | 61 | 1135 | 343 | 1091×282 |
| Live Market Overview | 1146 | 61 | 1493 | 343 | 347×282 |
| Market Ticker | 44 | 349 | 1494 | 385 | 1450×36 |
| Trending Now | 44 | 393 | 1494 | 449 | 1450×56 |
| Atalhos de categoria | 44 | 457 | 1494 | 508 | 1450×51 |
| Radar 24h | 44 | 516 | 582 | 707 | 538×191 |
| Market Sentiment | 590 | 516 | 1025 | 707 | 435×191 |
| Promo editorial | 1031 | 516 | 1494 | 707 | 463×191 |
| Latest News | 44 | 715 | 1025 | 861 | 981×146 |
| Newsletter | 1032 | 716 | 1494 | 861 | 462×145 |

**Composição estimada:** margem lateral ~44 px; intervalos entre módulos tipicamente 7–12 px; bordas finas; raios de canto próximos de 9–13 px. Essas cotas são **alvos iniciais**, e não valores já aferidos por engine DOM. A largura horizontal do hero/painel direito é aproximadamente 3,14:1. Os três painéis médios ocupam cerca de 37% / 30% / 32% da largura útil.

### 2.4 Contrato de densidade

- Header ocupa ~60 px, sem faixa de marketing extra.
- Primeira linha tem imagem de notícia dominante e coluna estreita para preços; **não** deve virar um hero centrado ocupando 800 px de altura.
- Duas barras informativas horizontais e uma linha de categorias aparecem logo depois do hero.
- Cards secundários de altura reduzida; tipografia compacta, sem truncar headlines de forma descontrolada.
- CTA e newsletter se integram à malha, não surgem como pop-up ou modal.
- Elementos de informação prioritária visíveis em 1536×864, mantendo textos legíveis e sem overlap.

### 2.5 Layout CSS de referência (orientação, não código aprovado)

```css
/* Calibrar via screenshots; nomes e medidas são hipóteses de implementação. */
:root { --cb-page-x: 44px; --cb-gap: 9px; }
.home-shell {
  width: min(calc(100% - 2 * var(--cb-page-x)), 1500px);
  margin-inline: auto;
}
.home-featured {
  display: grid;
  grid-template-columns: minmax(0, 3.14fr) minmax(300px, 1fr);
  gap: 11px;
}
.home-insights {
  display: grid;
  grid-template-columns: 1.23fr 1fr 1.06fr;
  gap: 8px;
}
.home-bottom {
  display: grid;
  grid-template-columns: 2.12fr 1fr;
  gap: 8px;
}
```

A disposição acima vale **somente** na referência desktop; grids e fluxo mobile são contratos separados.

---

## 3. Identidade: símbolo, lettering e assinatura

### 3.1 O logo aprovado é uma imagem de referência, não um SVG pronto

O arquivo original contém: olho horizontal com duas curvas metálicas/translúcidas; centro circular de moeda; pequenas marcas verticais no topo e na base do anel; raio energético no centro; bordas de verde-lima luminoso; tipografia `Coin` prateada/branca e `Blink` lime; tagline **Crypto news in a blink.** alinhada ao centro.

**Regras fixas:**
- Não trocar olho por escudo, hexágono, letra C abstrata ou Bitcoin ₿ puro.
- Não trocar a geometria básica dos pontos externos do olho nem da pupila circular.
- Preservar leitura de raio no núcleo e das pequenas barras do anel-moeda.
- Palavra exibida exatamente `CoinBlink` (C e B maiúsculos), grafia idêntica nos três idiomas.
- `Coin` branco/cinza-metálico; `Blink` verde-lima. Evitar substituí-lo por dourado/azul.
- O verde luminoso do símbolo aparece no hero promocional e em detalhes do portal.
- Slogan original continua **provisório** e pode ser pequeno ou omitido quando o contexto for estreito.

### 3.2 Conjunto de arquivos de produção a criar futuramente

| ID | Arquivo proposto | Uso | Contrato |
|---|---|---|---|
| BRAND-001 | `coinblink-symbol.svg` | Icon-only | Vetor verdadeiro, viewBox estável, sem raster embutido |
| BRAND-002 | `coinblink-horizontal-dark.svg` | Header dark | Símbolo + wordmark; legível a altura de ~46 px |
| BRAND-003 | `coinblink-horizontal-light.svg` | Header light | Mesma geometria; contraste revisado |
| BRAND-004 | `coinblink-stacked.svg` | Open Graph/editorial | Slogan opcional; manter proporção |
| BRAND-005 | `favicon.svg` e fallback `.png` | Tabs e PWA | Simplificação controlada do símbolo, sem perder o raio |
| BRAND-006 | `coinblink-logo-source.blend` ou vetor-fonte | Pipeline de produção | Editável e com autoria rastreável |

**Importante:** esses derivados **ainda não existem** e não devem ser listados como entregues. A vetorização deve ser auditada em 32, 48, 96, 128, 256 e 512 px e em fundo dark/light. A arte original não possui transparência; não fingir que colar o JPEG preto no header produz um PNG transparente de qualidade.

### 3.3 Animação do logo

- Estado normal: repouso estável e nítido.
- A cada alguns segundos, emissão suave de luz periférica (se passar no teste de distração), sem piscada agressiva.
- Hover/foco: leve aumento de intensidade do halo e um blink sutil das curvas do olho.
- Nenhum giro contínuo rápido; raio não pode desaparecer com motion.
- `prefers-reduced-motion: reduce` desliga loops e transforms decorativos.
- O favicon não deve depender de animação para ser reconhecido.

### 3.4 Espaço livre e legibilidade

Usar unidade `u = 1/4` da altura do símbolo; manter ao menos `u` de respiro entre o ícone e conteúdo vizinho. No desktop, o bloco símbolo + wordmark + microtagline deve ocupar aproximadamente os primeiros 270 px do header, calibrado com a imagem. Nunca comprimir horizontalmente o logo para caber no mobile: mudar para ícone + wordmark sem slogan e, em telas muito estreitas, usar símbolo isolado se validado.

---

## 4. Sistema de cores e materiais

### 4.1 Tokens iniciais dark

**Amostragem preliminar para desenvolvimento:** cada hexadecimal abaixo é ponto de partida **aproximado**, a calibrar contra amostras reais por região da referência (o JPEG introduz compressão, brilho e iluminação no mesmo pixel).

| Token semântico | Valor inicial | Função |
|---|---|---|
| `--cb-bg` | `#070E0C` | Fundo geral preto grafite |
| `--cb-surface` | `#0B1513` | Cards e barra superior |
| `--cb-surface-raised` | `#101E19` | Cards ativos / hover |
| `--cb-border` | `#244233` | Contornos discretos de painéis |
| `--cb-border-glow` | `rgba(163,255,104,.25)` | Arestas selecionadas |
| `--cb-lime` | `#B8F34B` | CTA e marca |
| `--cb-lime-glow` | `#8FFB42` | Reflexos e halos, nunca corpo de texto extenso |
| `--cb-text` | `#F5F8F5` | Manchetes e conteúdo principal |
| `--cb-text-muted` | `#A7B3AB` | Descrições e metadados |
| `--cb-text-subtle` | `#728379` | Microtexto, quando contraste permitir |
| `--cb-positive` | `#A6F454` | Valores positivos (com sinal + e texto) |
| `--cb-negative` | `#FF5B62` | Queda / alerta negativo |
| `--cb-warning` | `#F9B74A` | Alerta não crítico / escala do sentimento |
| `--cb-info` | `#8AB8FF` | Etiquetas neutras quando necessário |

**Não reduzir a informação a verde:** positivo em lime; negativo em vermelho; Bitcoin laranja; Ethereum prateado/lilás; Solana multicolorido; NFT/AI/DeFi por categoria com cor limitada aos ícones. A estrutura do site permanece predominantemente preto/verde.

### 4.2 Distribuição de cor

- ~80–90% do volume visual em neutros grafite/pretos; o restante em imagens e acentos.
- O lime aparece em branding, ações principais, indicadores ativos e linhas de cotação.
- Evitar blocos chapados verde-lima de grandes dimensões; a imagem depende de emissão concentrada, não de saturação uniforme.
- Manter superfície principal limpa atrás de textos: não sobrepor partículas e glow a áreas de leitura.
- Cards com texto nunca devem depender exclusivamente de blur para contraste.

### 4.3 Receitas de material (tokens independentes)

**Glass/card comum:** fundo `rgba(10,22,18,.76–.93)` sobre gradiente ou imagem, border de 1 px semi-transparente, `backdrop-filter: blur(10–18px) saturate(115%)`, sombra externa discreta e inner highlight no topo. No mobile/low-end reduzir blur ou usar cor sólida equivalente. **Não usar blur de 35–60 px indiscriminadamente.**

**Card elevado:** gradiente vertical muito suave + hairline superior; sombras 0 8–24 px com alfa baixo; hover com luminosidade +5–8% sem bordas fluorescentes por toda parte.

**Emissive neon:** duas camadas controladas: linha nítida interna + difusão externa, preferencialmente pseudo-elementos; o glow não pode desfocar a forma do botão.

**Glass image overlay:** gradiente de preto opaco próximo ao título para transparência progressiva sobre a fotografia. Deve funcionar mesmo quando a imagem de fundo for clara.

### 4.4 CSS inicial para cartão e foco (não final)

```css
:root {
  --cb-lime: #B8F34B;
  --cb-surface: #0B1513;
  --cb-radius-card: 11px;
}
.cb-glass {
  background: linear-gradient(145deg, rgba(17, 32, 25, .84), rgba(6, 15, 13, .94));
  border: 1px solid rgba(169, 216, 177, .15);
  border-radius: var(--cb-radius-card);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 9px 26px rgba(0,0,0,.20);
  backdrop-filter: blur(14px) saturate(115%);
}
.cb-glass:focus-within {
  outline: 2px solid var(--cb-lime);
  outline-offset: 2px;
}
@media (prefers-reduced-transparency: reduce) {
  .cb-glass { background: #0B1513; backdrop-filter: none; }
}
```

**Nota:** verificar suporte real e acessibilidade; a mídia `prefers-reduced-transparency` não tem suporte uniforme, portanto manter sempre fallback opaco.

---

## 5. Tipografia, conteúdo e ícones

### 5.1 Famílias e caráter

A imagem do header e da manchete usa letras *sans-serif* com aparência geométrica e peso forte. Não interpretar automaticamente como serifada. Testar **Inter Variable**, **Manrope Variable** ou alternativa métrica comparável; só aprovar após confronto das letras `CoinBlink`, `Bitcoin Breaks $70,000` e `Radar 24h` contra a referência. Não inserir fontes não licenciadas.

### 5.2 Escala inicial para viewport 1536×864

| Elemento | Estimativa CSS | Peso/line-height | Restrições |
|---|---|---|---|
| Header nav | 12–13 px | 500–600 / 1.2 | Sem quebrar linha |
| Logo wordmark | Asset, não fonte genérica | N/A | Derivado do original |
| Badge `BREAKING NEWS` | 11–12 px | 700 / 1.15 | Caps compactas |
| Headline do hero | 32–36 px | 750–850 / ~1.04 | ~3 linhas; não atravessar o Bitcoin |
| Descrição hero | 13–14 px | 400–500 / ~1.3 | 2–3 linhas, alto contraste |
| Título de módulo | 14–17 px | 650–750 / 1.2 | Não exceder altura do card |
| Card de artigo | 10–12 px | 600–700 / 1.2 | Conteúdo correto antes de truncar |
| Metadados | 9–11 px | 400–500 / 1.25 | Evitar texto ilegível de propósito |
| Preço no painel | 12–13 px | 600–700 / 1.1 | Alinhamento tabular |
| CTA principal | 12–13 px | 650–750 / 1.1 | Área clicável maior que a altura visual, se necessário |

Os valores acima são **hipóteses** de CSS, não extrações seguras da imagem. Medir via overlay depois que fonte e densidade estiverem estabilizadas. No mobile, manter texto de corpo em tamanho legível, mesmo que altere a densidade relativa da referência desktop.

### 5.3 Regras de microtipografia

- Dados financeiros usam `font-variant-numeric: tabular-nums` para evitar dança de caracteres.
- Decimais, valores positivos e negativos devem ter unidades/sinais visíveis.
- Headline editorial respeita quebras naturais em inglês; não forçar traduções ao mesmo número de linhas.
- Caps e tracking moderado para rótulos; evitar letter-spacing excessivo em corpo de notícia.
- Nunca deixar uma linha de texto sobrepor outra ao mudar o idioma.
- Cortes com `line-clamp` só em lugares cujo design prevê cards de prévia; matéria completa não é cortada.
- Verificar densidade com os dados mock fixos antes de conectar notícias de tamanhos diversos.

### 5.4 Iconografia SVG

Biblioteca sugerida: **Lucide** para navegação e affordances funcionais; ícones de marca/ativos e hero devem ser **SVG customizados**, não Lucide genérico. Normalizar `viewBox`, espessura, optical alignment e tamanho de bounding box.

Matriz inicial:

| Lugar | Família | Tamanho inicial | Cor/efeito |
|---|---|---|---|
| Search | Lucide `search` | 16–18 px | Cinza claro |
| Theme | Lucide `moon`/`sun` | 16–18 px | Branco/lime ativo |
| Language | Lucide `globe` | 15–17 px | Branco |
| Breaking | Bolt SVG próprio | 13–16 px | Lime |
| Bitcoin | Identidade do ativo (licença/uso permitido) | 20–26 px | Laranja |
| Ethereum | Ícone ETH próprio ou asset autorizado | 20–26 px | Prata/lilás |
| Solana | Ícone de ativo autorizado | 20–26 px | Gradiente da identidade |
| Radar | Eye/target SVG coerente com CoinBlink | 18–22 px | Lime |
| Sentiment | Gauge/target em SVG | 18–22 px | Lime |
| Newsletter | Mail SVG | 19–22 px | Lime |
| Categorias | Ícones semânticos próprios/Lucide | 22–26 px | Cor funcional de categoria |

**Não usar emoji nativo como ícone de navegação.** SVG sem texto embutido. Ícones puramente decorativos `aria-hidden="true"`; ações com accessible name.

---

## 6. Anatomia componente por componente: referência desktop

### 6.1 `SiteHeader` [NECESSARY]

**BBox alvo:** x~35–1502, y~0–61. Background quase preto com leve gradiente. Logo na esquerda, nav central e controles à direita; sem second header adicional. Menu visível na imagem: `Home`, `News`, `Markets`, `Analysis`, `Learn`, `Tools`, `Videos`, `About`, com caret nos itens que abrem submenu. `Home` tem underline lime fina e iluminação suave.

**Controles no canto direito:** campo de busca com ícone de lupa, placeholder `Search news, coins, topics...`, atalho visual do teclado; seletor de idioma `EN` com globo e caret; controle dark/light com ícone e switch lime.

**Comportamento:** marca clicável para home, navegação por teclado, dropdown por clique/foco (hover auxiliar), busca com submissão real, idioma com `en`/`pt-BR`/`es`, seletor de tema persistível. Header pode tornar-se sticky apenas se a comparação com scroll e ergonomia confirmar; não mexer na posição inicial.

**Estados:** default, hover, focus-visible, nav-active, menu-open, search-idle, search-loading, search-no-results, theme-changing. Mobile: botão menu explícito e logo compacto. Não mostrar opção `Sign In` porque ela não aparece no golden aprovado; somente se requisito posterior justificar.

**Aceite:** proporções e baseline da marca não divergem; fontes não ocupam a altura toda; busca não empurra o seletor de idioma; estado ativo visível sem depender de cor isoladamente.

### 6.2 `BreakingHero` [NECESSARY, PRIORIDADE VISUAL MÁXIMA]

**BBox alvo:** x~44–1135, y~61–343. O layout tem cantos de ~11px, borda discreta, recorte limpo no canto esquerdo e composição fotográfica cinemática.

**Coluna texto:** inicia por badge lime de raio/`BREAKING NEWS`, ao lado tempo relativo; em seguida headline grande `Bitcoin Breaks $70,000 as Institutional Inflows Hit Record Highs`, com o valor `$70,000` destacado em lime. Descrição branca/cinza em três linhas. Dois botões: `Read Full Story` lime sólido com seta; `Watch Analysis` outline dark com círculo play e alinhamento horizontal.

**Cena:** Bitcoin 3D dourado como elemento principal, ancorado por rochas montanhosas escuras; flecha/linha bullish lime sobe diagonalmente; barras candle/luminescência ao fundo; profundidade atmosférica sem virar tela inteira de UI fictícia. O Bitcoin não é um mero emoji/ícone 2D. A imagem final deve reproduzir a **mesma composição visual aproximada da referência**, por render/arte original separável e auditável.

**Overlays de dados à direita:** label pequeno de `NEW ALL-TIME HIGH`, preço destacado `$70,243`, percentual positivo `+5.82%`, e no canto direito um microbloco vertical de palavras-chave (`INSTITUTIONAL`, `ADOPTION`, `REGULATION`, `ETF FLOWS`, `BULL RUN`). Esses textos e números são *mock*, portanto uso real deve vir de notícias/preços verdadeiros ou adaptar o módulo a uma pauta que não afirme falso recorde.

**Distribuição aproximada:** texto ocupa x local 22–420 px; imagem se concentra da metade da área até o lado direito; bitcoin grande na região central-direita; CTA abaixo da descrição, sem encostar no limite inferior. Nunca cobrir a área de título com cotações animadas.

**Implementação:** `<section>`/`<article>` real + imagem/asset independente + overlay gradiente + DOM textual + SVGS individuais. Asset preparado idealmente com camadas `foreground rocks`, `coin`, `chart energy`, `background`; considerar uma imagem precomposta como fallback de baixo custo para LCP. Ajustar `object-position` até que moeda, montanha e luz ocupem mesma posição do golden.

**Comportamento:** `Read Full Story` leva a matéria existente, `Watch Analysis` só aparece quando existir vídeo real autorizado; caso contrário, apresentar CTA alternativo aprovado (nunca botão morto). Atualizar hero por seleção editorial, não por loop automático compulsivo. Cabeçalhos, imagens e timestamps atualizados juntos, sem exibir informação antiga como live.

**Falhas bloqueantes de design:** Bitcoin em posição errada, cenário sem profundidade, card todo verde brilhante, título serifado/muito pequeno, muitos overlays que prejudicam legibilidade, marca não reproduzida ou hero que exige scroll para chegar ao ticker no desktop golden.

### 6.3 `LiveMarketOverview` [NECESSARY para composição; dados segundo contratos]

**BBox:** x~1146–1493, y~61–343. Altura alinhada à do hero. Card escuro com borda verde discreta. Header `Live Market Overview`, ponto verde + `Live`, divisor fino e cinco linhas uniformes: BTC, ETH, SOL, BNB, XRP. Cada linha tem ícone do ativo, nome principal e ticker menor, sparkline lime, preço no lado direito e variação positiva/negativa. Rodapé `View All Markets →` em lime.

**Grid interno:** coluna ícone, coluna nome, coluna sparkline, coluna preço, coluna variação. Usar números tabulares, `min-width:0`, whitespace controlado e `grid-template-columns`, não alinhar com espaços de texto. Labels cronometrados e timestamp de fonte obrigatórios quando integrar dados reais; `Live` só quando o feed estiver efetivamente recente.

**Degradado:** cards agrupados e compactos; pequenos divisores horizontais. Na referência, linhas têm altura visual próxima de 39–43 px (estimativa). Não usar gráfico com eixos na sparkline. `aria-label` inclui preço/variação, não somente traçado visual.

**Fallback:** carregando, stale e falha devem preservar altura visual e mostrar última atualização, sem inventar verde positivo.

### 6.4 `MarketTickerStrip` [NECESSARY]

**BBox:** x~44–1494, y~349–385. Faixa de ~36px. Rótulo `Market Ticker` à esquerda, ícone circular e 6–7 ativos em linha. No golden há BTC, ETH, SOL, BNB, XRP, DOGE, ADA. Cada ativo contém ícone, ticker, preço, diferença e separadores verticais finos.

**Regras:** overflow horizontal com máscara/scroll adequado, sem encolher fonte até ficar ilegível; atualização não desloca os elementos; animação de valor opcional só em atualização, não scroll-marquee obrigatório. O ticker não deve competir com o hero.

### 6.5 `TrendingNowStrip` [NECESSARY]

**BBox:** x~44–1494, y~393–449. Faixa separada com label vermelho/coral `Trending Now` e ícone de chama; à direita 5 itens numerados em círculos escuros, título de uma ou duas linhas e tempo relativo. Seta final. Os temas da imagem são *fictícios*, portanto conectar às pautas verificadas e aprovadas.

**Seleção de conteúdo:** ranking determinado pelo Impact Engine/editoria, não por rumores de alto engajamento sem verificação. Se houver 3 itens, card não deve esticar as palavras para preencher artificialmente cinco espaços. Em tela menor, permitir rolagem horizontal com foco acessível.

### 6.6 `TopicShortcutRail` [NECESSARY]

**BBox:** x~44–1494, y~457–508. Linha de dez atalhos no golden: Bitcoin, Ethereum, Altcoins, DeFi, NFTs, Regulation, Web3, AI x Crypto, Market Analysis, Guides. Cada célula é um pequeno card vidro retangular com cantos arredondados, ícone à esquerda e título/subtítulo compactos. Um chevron à direita indica navegação.

**Tecnologia:** SVG com cores categoria; grade responsiva ou rail navegável horizontalmente. Link semântico, navegação de teclado, estado hover/focus. Não inventar 15 categorias extras no MVP. O limite visual exato de 10 é parte da composição de referência.

### 6.7 `Radar24hPanel` [NECESSARY, FEATURE EMBLEMÁTICA]

**BBox:** x~44–582, y~516–707. Título com ícone de olho/radar lime `Radar 24h`; linha explicativa curta `Key events and market-moving updates from the last 24 hours.`; link `View All →` à direita. A área principal é timeline vertical de cinco entradas com tempos à esquerda (`2h ago`, `4h ago` etc.), pontos conectados por haste lime, manchetes e chips de ativos/assuntos.

**Grid sugerido:** tempo à esquerda, 12–18px para linha/pontos, headline flexível, chips à direita apenas quando houver espaço. Densidade calibrada para até 5 linhas no golden. Manter altura parecida para não empurrar o bloco inferior.

**Estados:** nenhum evento, 1–5 eventos, mais eventos (link), atualização recente, item bloqueado editorialmente (não publicar), evento corrigido (marcação e histórico). Timestamp absoluto disponível via tooltip/acessibilidade; tempo relativo recalculado sem reflows grandes.

### 6.8 `MarketSentimentPanel` [NECESSARY para home visual, índice real sob contrato]

**BBox:** x~590–1025, y~516–707. Cabeçalho com ícone `Market Sentiment` e ponto `Live`. A metade esquerda contém gauge semicircular **vermelho → laranja → amarelo → lime**, com valor grande central (na imagem `78`) e categoria (`Greed`). Marcas `0` e `100`. A metade direita é legenda/percentuais de `Extreme Greed`, `Greed`, `Neutral`, `Fear`, `Extreme Fear`, seguida de link `View Sentiment Analysis →`.

**Implementação:** SVG responsivo customizado (não donut chart padrão), `stroke-dasharray` ou caminhos precisos, arco com extremidades e ponteiro compatíveis com screenshot, sombra luminosa moderada. A leitura semântica deve dizer nome da métrica, valor, escala, provedor e hora. A imagem mistura grau geral com distribuição por classes: **validar se o fornecedor realmente entrega ambos**. Se não, substituir a legenda fictícia por dados honestos sem perder a geometria, mediante evidência e aprovação visual.

### 6.9 `EditorialPromoPanel` [NECESSARY VISUAL; conteúdo do anúncio controlado]

**BBox:** x~1031–1494, y~516–707. Grande imagem promocional dark mostrando montanhas, figura humana pequena, céu verde energético, planeta/globo e símbolo CoinBlink. Logo pequeno acima, headline forte `STAY AHEAD OF THE NEXT MOVE.`, texto curto e CTA `Join Now →` lime. A luz deve se concentrar à direita, preservando fundo quase preto atrás da headline.

**Uso real:** no lançamento, pode promover Radar, newsletter ou recurso existente. Não prometer serviço premium, seguidores, taxas de retorno ou serviço inexistente. Se virar anúncio pago, identificá-lo visual e semanticamente como `Advertisement/Sponsored` e aplicar política de publicidade. O CTA deve ser real.

**Produção do asset:** render 3D original ou composição de imagens licenciadas; não fazer crop direto do screenshot para uso final do card, exceto provisoriamente em protótipo fechado claramente marcado como reference mock.

### 6.10 `LatestNewsPanel` [NECESSARY]

**BBox:** x~44–1025, y~715–861. Painel inferior largo. Cabeçalho com ícone de documento, título `Latest News`, filtro horizontal `All, Bitcoin, Ethereum, Altcoins, DeFi, Regulation, NFTs, AI, More`, link `View All News`. Abaixo, quatro previews de notícia na mesma linha, cada um com miniatura cinematográfica à esquerda e texto/label à direita. Na imagem há BTC, ETH, legislação e SOL.

**Card de notícia:** thumb com raio pequeno, tag de categoria (`MARKET`, `DEVELOPMENT`, `REGULATION`, `ECOSYSTEM`), horário, headline de ~2–3 linhas, extrato curto. Cards com borda suave e espaço mínimo, não converter a sessão em quatro cartões enormes verticais no desktop. Tema e texto de manchete devem vir de banco editorial, com o ID da matéria e status de aprovação. `More` abre menu real, não decoração.

**Falhas comuns:** thumbnail cortada, texto fora do painel, título de seção enorme, borda grossa, grade com três cards quando referência pede quatro, área interna excessivamente clara.

### 6.11 `NewsletterPanel` [NECESSARY visual; integração conforme escopo]

**BBox:** x~1032–1494, y~716–861. Fundo escuro com leve céu/planeta verde do lado direito. Ícone de envelope lime à esquerda; heading `Join the CoinBlink Newsletter`; texto curto, input `Enter your email address`, CTA `Subscribe →`; microindicadores `No spam`, `Weekly roundup`, `Exclusive insights`.

**Comportamento:** formulário funcional (double opt-in recomendado conforme jurisdição), consentimento, política de privacidade, mensagens de sucesso/erro, sem falso estado de sucesso. Input semanticamente rotulado; erros anunciados a leitores de tela; loading sem deslocar botão. Sem pop-up agressivo.

### 6.12 Art direction cross-component

Miniaturas/ativos seguem o mesmo tratamento: profundidade, cenário escuro, iluminação verde ou cor natural da moeda, bom contraste, foco principal legível. Preferir fotos editoriais e gráficos verificáveis em matérias factuais; render gráfico pode ser usado como ilustração se identificado e apropriado. Não criar imagens hiper-realistas que representem falsamente um acontecimento real como se fossem fotografia documental.

---

## 7. Biblioteca de componentes e contratos de implementação

### 7.1 Estrutura sugerida

```text
src/
  layouts/
    BaseLayout.astro
  pages/
    index.astro
    pt-br/index.astro
    es/index.astro
  components/
    brand/Logo.astro
    layout/SiteHeader.astro
    layout/MarketTickerStrip.tsx
    home/BreakingHero.astro
    home/LiveMarketOverview.tsx
    home/TrendingNowStrip.tsx
    home/TopicShortcutRail.astro
    home/Radar24hPanel.tsx
    home/MarketSentimentPanel.tsx
    home/EditorialPromoPanel.astro
    home/LatestNewsPanel.astro
    home/NewsletterPanel.tsx
    ui/GlassCard.astro
    ui/CategoryTag.astro
    ui/Icon.tsx
    ui/ActionButton.astro
    charts/Sparkline.tsx
    charts/SentimentGauge.tsx
  styles/
    tokens.css
    global.css
    material-glass.css
    motion.css
  lib/
    i18n/
    ui/
  data/
    home-fixtures.en.ts
public/
  brand/
  editorial/
  illustrations/
```

**Não executar essa estrutura cegamente**. Quando houver repo, o executor deve ler Architecture, Scope, DoD e checkpoint e adaptar nomes/pastas para evitar duplicação com padrões já aprovados.

### 7.2 Estratégia Astro Islands

Renderizar artigos, navegação não interativa e layouts com Astro/HTML nativo. Hidratar React somente onde necessário: preços mutáveis, pesquisa dinâmica, gauge, mudanças de filtro, newsletter, menu dependente de estado. Evitar hidratação integral da home, sobretudo com cards compactos. Em cada island, guardar dimensões estáveis para reduzir CLS.

### 7.3 Dependências recomendadas

| Tecnologia | Finalidade | Política |
|---|---|---|
| Astro | Estrutura e conteúdo editorial SSR/SSG/híbrido | Principal, sujeito à ADR |
| React + TypeScript | Widgets interativos | Adotar apenas onde agrega |
| Tailwind CSS | Layout responsivo + utilitários | Tokens centralizados; sem classes arbitrárias conflitantes |
| CSS nativo | Materiais de vidro, bordas, glow, gradientes | **Essencial** à fidelidade |
| Motion (motion.dev) | Interações, entradas, transform e timing | Principal motor de motion |
| Lucide | Ícones utilitários SVG | Sem substituir logo/ícones autorais |
| Radix / shadcn/ui seletivo | Dialog, dropdown, popover, input acessível | Usar primitivas; customização visual total |
| SVG próprio | Radar, sentiment, sparkline, marca | Preferido para precisão |
| Lightweight Charts | Gráficos financeiros completos, se houver | Somente onde necessário; conferir atribuição/licença |
| Blender | Produzir render do hero e cards cinematográficos | Pipeline offline; não runtime obrigatório |
| Three.js + R3F | 3D interativo | **FUTURE/ONLY-IF-PROVEN NECESSARY** |
| GSAP | Sequência avançada não coberta pela stack principal | Opcional, evitar duplicar Motion |
| Playwright | Screenshots e testes E2E/visuais | Obrigatório na auditoria de UI |
| axe-core | Acessibilidade automática suplementar | Com inspeção manual |

**Regra de dependências:** nenhuma biblioteca adicionada apenas porque demonstra uma animação bonita. Primeiro resolver com CSS/SVG/Motion. Registrar motivo, bundle impact e benefício de cada adição.

---

## 8. Sistema de layout e breakpoints

### 8.1 Desktop referência `1536×864`

É o único viewport para o qual existe golden aprovado. Este é o **modo de fidelidade visual máxima**. Reproduzir margens, panel ratios e dobra primeiro, com fixtures determinísticas. Não inferir que o tamanho relativo dos elementos permanecerá idêntico em outras proporções.

### 8.2 Desktop intermediário `1280–1535px`

Reduzir progressivamente largura do hero e do mercado, preservar duas colunas quando o mercado tiver espaço para cinco linhas sem truncar preços. Os dez atalhos podem permitir scroll/compactação moderada. Fontes do corpo não devem cair abaixo do mínimo de leitura. O Radar, sentimento e promo permanecem 3 colunas enquanto forem viáveis.

### 8.3 Desktop estreito/notebook `1024–1279px`

Hero ainda prioritário. Mercado pode mover para segunda linha quando contrair criticamente; não esmagar a imagem 3D. Ticker rola horizontalmente. Radar + Sentiment podem formar duas colunas; promo desce para linha seguinte. Latest News pode usar 2 cards por linha; não aumentar a densidade em prejuízo de legibilidade.

### 8.4 Tablet `768–1023px`

Header com menu comprimido/hambúrguer. Hero full width. Mercado ganha card próprio full width, seguido de ticker scrollável, trending e categorias. Radar e sentimento em duas colunas quando couber, promo abaixo. Latest News 2 colunas. Newsletter ocupa largura total. Reduzir iluminação ambiental e parallax; não cortar manchete.

### 8.5 Mobile `320–767px`

- Header compacto (~56–68px), símbolo + wordmark se possível, busca acessível, menu e troca de tema/idioma dentro de painel.
- Hero em card full width com arte em proporção adaptada, texto sobre área escura contrastante; título ~24–32px conforme viewport; CTA principal visível, secundário condicionado a conteúdo.
- Mercado compacto com scroll horizontal ou 2 colunas, sem microfonte ilegível.
- Ticker e Trending em rails acessíveis por toque.
- Categorias com scroll-snap leve em uma linha ou grade 2 colunas conforme testes.
- Radar 24h, sentimento, promo, últimas notícias e newsletter empilhados nesta ordem, salvo dados de UX que justifiquem mudança.
- Últimas notícias com thumbnails 88–112 px e headlines de 2 linhas, sem 4 miniaturas lado a lado.
- Área de toque próxima de 44×44 CSS px, foco visível, sem hover como única forma de revelar informação.

### 8.6 Regras de overflow e estabilidade

- Nada deve ultrapassar viewport causando `document.scrollWidth > window.innerWidth`.
- Cards com altura visual semelhante preservam espaços enquanto carregam.
- `aspect-ratio` para imagens, tipografia pré-carregada apenas quando relevante, placeholders de tamanho fixo.
- Não transformar a imagem inteira em background responsivo: perderia semântica, nitidez e controle de crop.
- Preferir CSS Grid para regiões principais; Flex para microcontroles, tabelas de preços e chips; Container Queries quando o comportamento depender da largura do módulo.

### 8.7 Breakpoints são propostas

Os valores acima são pontos de projeto, não uma decisão já validada. **Observar onde a interface quebra** e ajustar por conteúdo, não simplesmente por tamanhos arbitrários. O golden desktop jamais será distorcido para simular mobile.

---

## 9. Light theme: mesma marca, nova superfície

### 9.1 Status

O usuário exige light + dark, mas **somente dark foi aprovado em imagem**. Light será uma variante funcional com revisão própria; não marcar como `VISUAL_APPROVED` antes de screenshot e decisão do usuário.

### 9.2 Tokens iniciais light (provisórios)

| Token | Valor sugerido | Intenção |
|---|---|---|
| `--cb-bg` | `#F6F8F6` | Fundo gelo claro, sem brilho excessivo |
| `--cb-surface` | `#FFFFFF` | Cards |
| `--cb-surface-raised` | `#EEF4EF` | Camadas elevadas |
| `--cb-border` | `#D6E2D8` | Separação suave |
| `--cb-text` | `#111B15` | Texto escuro |
| `--cb-text-muted` | `#53665B` | Metadados |
| `--cb-lime-action` | `#537A00` ou tom testado | Lime escurecido para texto/ações acessíveis |
| `--cb-lime-emissive` | `#B8F34B` | Halo e decoração, nunca texto insuficiente |

### 9.3 Comportamento do tema

- CSS variables sem duplicar cada componente.
- Prevenir flash de tema incorreto quando app renderiza.
- Preferência explícita do usuário tem prioridade sobre OS; padrão inicial pode acompanhar OS somente se não houver escolha gravada, com dark como apresentação institucional das peças de marketing.
- Imagens hero que dependem de fundo preto precisam de tratamento adaptado: overlay ou variante light aprovada, **sem** converter Bitcoin dourado em cinza sem motivo.
- Verificar contraste de links, ícones, grafismos e textos em ambos os temas.

---

## 10. Motion & interaction Bible

### 10.1 Princípio

Movimento deve comunicar hierarquia, atualização e precisão. O portal não pode parecer uma cena de jogo. **Uma animação chama atenção; dez competindo entre si roubam a notícia.**

### 10.2 Timing proposto

| Interação | Duração alvo inicial | Curva | Condição |
|---|---:|---|---|
| Hover de botões | 120–180 ms | `ease-out` | Somente hover-capable |
| Mudança de glow/borda | 180–260 ms | `ease-in-out` | Sem layout shift |
| Elevação de card | 160–220 ms | `ease-out` | Até 2px |
| Reveal ao entrar viewport | 200–320 ms | `ease-out` | Uma vez; nunca esconder conteúdo em SEO |
| Entrada de dropdown | 120–180 ms | `ease-out` | Foco e clique suportados |
| Mudança numérica de preço | 180–350 ms | suave | Só em dado realmente novo |
| Gauge ao carregar | 400–750 ms | `ease-out` | Uma vez, reduzir motion respeitado |
| Pulso de brand halo | ciclo ~3–5 s | suave | Baixa opacidade, opcional, sem piscar |
| Ticker rolável | movimento pelo usuário | N/A | Não forçar autoplay para leitura |

### 10.3 Hero cinematic

**Camadas propostas**, se assets separados existirem:
1. Fundo de montanhas e neblina: quase estático.
2. Bitcoin: leve iluminação pulsante, posição essencialmente estável.
3. Linha de mercado lime: brilho caminhando discretamente ao longo do SVG, sem sugerir cotação real inexistente.
4. Micro-partículas: poucas, com velocidade baixa e opacidade discreta.
5. Reflexos do vidro: highlights reagindo ao cursor apenas em desktop, com movimento máximo limitado.

Se essas camadas adicionarem custo excessivo ou quebrarem o golden, usar hero pré-renderizado + animações CSS menores. O LCP não depende da execução de WebGL.

### 10.4 Interação `hover/focus`

- Botão lime: leve ganho de brilho, opcional seta +2px; texto não muda posição.
- Card comum: brilho fino no contorno superior e elevação discreta.
- Atalho categoria: ícone pode mover 1–2px; não rotacionar e distorcer identidade.
- Radar: linha/bolinha do item ativo realça e item recebe fundo escuro elevado.
- Gráfico: tooltip com valor e timestamp real; não falsificar tendência com motion.
- Theme toggle: thumb anima curta sem comprometer acessibilidade.

### 10.5 Acessibilidade de movimento

Cumprir `prefers-reduced-motion`: desativar loops, parallax, brilho viajante, animadores de contagem decorativos, rolagem automática e entrada deslocada. Mudanças de estado permanecem visíveis imediatamente. Não usar flashes estroboscópicos. Evitar animation que gere motion sickness.

---

## 11. Produção de imagens e 3D

### 11.1 Hero é um asset autoral de alta prioridade

O screenshot aprovado contém uma arte rica que **não é isolável automaticamente em seus objetos reais**. O objeto a ser produzido deverá conter componentes equivalentes: moeda Bitcoin 3D com material metal dourado, rochas pretas com reflexo lime, candlesticks verdes, curva ascendente e atmosfera de fumaça/montanhas.

**Pipeline proposto:** storyboard de composição → base Blender (coin/geometria/rock/lighting) → render 2K/4K → layers/EXR ou PNG transparentes quando necessário → color grading consistente → export AVIF/WebP/PNG de fallback → inspeção sob overlay a 1536×864. Não se comprometer com Blender para todos os thumbnails; imagens editorialmente verdadeiras podem exigir fotos/documentos com licença e atribuição.

### 11.2 Parâmetros artísticos para o hero

- Câmera 3/4 leve para face de BTC legível, com moeda deitada/vertical e perspectiva semelhante ao golden.
- Principais highlights dourados na face da moeda; contornos verdes ambientais.
- Fundo sem estrelas genéricas em excesso; gráfico/candles como elemento secundário e discreto.
- Horizonte e rochas ancoram fisicamente a moeda.
- Área esquerda intencionalmente mais escura para receber manchete.
- Não gerar texto gráfico dentro do raster do hero; texto deve ser HTML, inclusive preço e callouts.
- Proporções, escala, centro óptico e recorte final comparados ao golden.
- Export render pré-comprimido com fallback estático e tratamento para `object-position` nos viewports.

### 11.3 Card promocional e thumbnails

Promo: figura humana pequena, planeta/halo lime e paisagem montanhosa; manter orientação esquerda escura e luz à direita. Thumbnails: BTC dourado, ETH metálico em montanha/fundo frio, governo em arquitetura real ou ilustração identificada, Solana com luz/cor original. Não inventar o retrato de pessoa real como imagem de fato noticioso.

### 11.4 Metadados necessários para cada asset

`asset_id`, versão, origem, criador/ferramenta, licença/permissão de uso, hash SHA-256, source master, prompt/workflow quando aplicável, dimensões, forma de export, alt text ou `decorative`, light/dark variants, localização visual, relação com golden screenshot, data de validação, evidência de comparação.

### 11.5 Condições de publicação

O gold screenshot pode ser apresentado ao time como referência de design; **não usá-lo em produção fingindo ser a interface funcional**. Quando um asset representar informação factual ou marca de terceiros, verificar direitos e não confundir imagem sintética com fotografia jornalística. O logo CoinBlink está aprovado esteticamente, mas seu clearance para uso comercial continua pendente.

---

## 12. Responsabilidade semântica, UX e SEO visual

- Hierarquia real de `h1`, `h2`, `h3` separando a manchete principal, módulos e títulos de artigos. O hero só tem um `h1` por página quando houver semântica de home apropriada.
- Não usar canvas para texto da matéria. Texto HTML indexável e selecionável.
- Links de notícia abrem uma URL persistente, com label e foco visíveis.
- Hero LCP com `width`, `height`, fetch priority apropriada, preload seletivo e `srcset`/`sizes` coerentes.
- Search, idioma e tema não podem exigir login.
- Ad blocks com `Sponsored/Advertisement`, sem parecer botão editorial ou notícia validada.
- SEO internacional `en` primário, `pt-BR` e `es` com URLs distintas quando houver traduções: `/`, `/pt-br/`, `/es/`. `hreflang` só para conteúdo efetivamente traduzido e publicado.
- `lang` do documento corresponde ao locale, com formatação numérica e datas localizadas. A marca e nomes dos ativos não são traduzidos.
- Preservar título, data editorial de publicação/atualização, autor ou autoria automatizada declarada conforme política e correções acessíveis.
- Taxa de dados e freshness: `Live` só quando houver feed recente e verificado.

---

## 13. Acessibilidade e contraste

### 13.1 Requisitos de base

- Alvo mínimo WCAG 2.2 AA para conteúdo e interações relevantes.
- Contraste texto normal ≥4.5:1; texto grande ≥3:1; UI/ícones essenciais ≥3:1 onde aplicável.
- `focus-visible` distinto de hover, não coberto por glow excessivo.
- Navegação por teclado para menu, filtros, busca, ticker, carrossel, notícias e newsletter.
- Labels de inputs persistentes, mensagens de erro associadas, estado disabled/loading compreensível.
- Padrão touch target confortável; evitar alvos minúsculos apenas por fidelidade desktop.
- Legendas e representações textuais para gráficos; não codificar positivo/negativo apenas por cor.
- Aria-live para notícias e preços **com parcimônia** para não produzir leitura incessante em screen readers.
- Skeletons e animações não devem bloquear navegação.
- CSS deve tolerar zoom 200% e preferências de redução de movimento e aumento de contraste.

### 13.2 Exceções a discutir

Onde microtexto do mockup for ilegível em celular ou para usuários com visão reduzida, **acessibilidade prevalece** e o layout responsive pode divergir com evidência. Documentar a exceção por viewport; não adulterar o golden desktop.

---

## 14. Orçamento de desempenho visual

### 14.1 Metas de produto

- Core Web Vitals de referência: **LCP ≤ 2,5 s**, **INP ≤ 200 ms**, **CLS ≤ 0,1** no percentil recomendado e contexto de teste definido.
- Evitar que uma home bonita exija download de vídeo de fundo, WebGL pesado e bibliotecas de animação duplicadas.
- Preferir imagens corretamente dimensionadas, AVIF/WebP com JPEG/PNG fallback, cache CDN e carregamento lazy abaixo da dobra.
- Hero com estratégia LCP específica (não lazy), assets decorativos adiados e tipografia estável.
- Uso de `content-visibility`, virtualization ou limites de DOM apenas quando medido; não esconder notícias indexáveis sem estudo.
- Gráficos de linha miniatura feitos com SVG leve e datasets agregados/cacheados; não instanciar uma biblioteca de chart pesada para cada sparkline.
- Hidratação por ilhas. Evitar 10 WebSocket independentes com requisição redundante ao mesmo feed.
- Respeitar preferências do aparelho para animações em loop e blur.

### 14.2 Performance Gate

Medir desktop e mobile em CI/lab com rede/CPU fixas; registrar bundle, LCP, INP ou proxy laboratorial, CLS e peso do hero. Uma regressão significativa causada exclusivamente por efeitos cosméticos é `CORRECTION REQUIRED`. Números reais de baseline devem ser coletados na implementação; ainda **não há benchmark**.

---

## 15. Fidelidade visual: método objetivo de auditoria

### 15.1 O que significa “extremamente fiel”

É **maximizar equivalência perceptual** da referência em viewport, sem sacrificar funcionalidade nem veracidade. Não prometer fidelidade matemática de 100% a uma imagem gerada por IA: o screenshot é JPEG com iluminação e pixels sintetizados, não uma renderização HTML recuperável. Precisamos de métodos reproduzíveis, não de elogios genéricos.

### 15.2 Pré-requisitos do benchmark

- Referência: `1536×864` dark, conteúdo mock em inglês.
- Browser fixado (ex.: Chromium versionado no Playwright), viewport e deviceScaleFactor fixos; documentar OS/container.
- Fonts carregadas e estáveis; imagens localmente disponíveis; animações desabilitadas/freeze; tempo congelado; fixtures sem chamadas a APIs externas.
- Render ao mesmo tamanho do golden, captura da página no mesmo recorte.
- Dinâmica real desativada durante *reference screenshot testing*; testes de dados atualizados são separados.

### 15.3 Métricas do Fidelity Gate

Abaixo, metas **propostas** sujeitas à calibração durante o primeiro incremento de UI. Não confundir com testes já executados.

| Dimensão | Método | Gate de referência proposto |
|---|---|---|
| Layout | Comparar bounding boxes DOM com tabela da seção 2.3 | Painéis críticos dentro de tolerância inicial ±4–8 px, refinada após provas |
| Hierarquia | Checklist editorial + inspeção de overlay | Ordem e peso visual correspondentes; zero falta de módulo |
| Cores | Samplers de regiões planas; perceptual Delta E | Divergência baixa em fundos/contornos (limiar calibrado), ignorando emissões dinâmicas |
| Tipografia | Sobreposição de bounding boxes de textos e baselines | Line wrapping do hero e títulos correspondentes em inglês |
| Imagens | Comparação visual estruturada do hero/crops | BTC, montanhas, brilho e overlays na posição correta; revisão humana obrigatória |
| Pixel diff | Playwright screenshot comparison vs screenshot **da própria implementação já aprovada** | Zero regressões fora de limiares por região |
| Golden reference | Overlay 50/50, diff map e SSIM/LPIPS se apropriado | Métricas **auxiliares**, não substituem inspeção humana |
| Responsividade | Screenshots por breakpoint | Sem overflow, sem áreas ilegíveis ou perdidas |
| Interação | E2E | Todos os affordances visíveis têm comportamento real |
| Acessibilidade | axe + navegação humana | Nenhum problema crítico/sério sem resolução/aprovação |

**Por que distinguir dois tipos de screenshot:** (A) comparação com o *golden sintético do usuário* mede fidelidade estilística, mas não se deve criar bloqueio automático baseado só em diferença pixel-a-pixel; (B) após aprovar o primeiro screenshot HTML real, ele se torna um baseline estável para identificar regressões reais no código.

### 15.4 Ferramentas

- Playwright `toHaveScreenshot()` com snapshots versionados e ambiente fixo.
- Capturas de áreas com `locator.screenshot()` para header, hero, ticker, Radar, sentiment etc.
- Overlay semitransparente `reference` vs `implementation` para análise de offsets.
- Diff map absoluto e inspeção por componente com coordenadas.
- Hash SHA-256 para golden, logo e baselines aprovados.
- Vídeos/gifs de motion testados à parte, preferencialmente com captura curta e estado determinístico.
- Logs de decisão, screenshots antes/depois e Work Order vinculados a PR.

### 15.5 Modelo de relatório de correção

```text
VISUAL DIFF REPORT
WO-ID: CB-UI-WO-###
Base SHA / Head SHA:
Viewport / browser / DPR:
Golden reference hash:
Region ID:
Expected geometry:
Actual geometry:
Difference px / contrast / crop:
Cause hypothesis:
Files touched:
Evidence before / after:
Tests / accessibility / perf:
Verdict: APPROVED | CORRECTION REQUIRED | BLOCKED
Checkpoint Delta proposed (not self-promoted):
```

### 15.6 STOP CONDITIONS visuais

NÃO aprovar o incremento se: faltar módulo do golden; hero com composição claramente divergente; marca deformada; contraste insuficiente; componente não funcional; layout causando overflow; imagens desproporcionais; dados fictícios expostos como live; interação invisível ao teclado; regressões de performance importantes; ou screenshot sem método reproduzível.

O próximo incremento de implementação não começa enquanto o atual estiver `CORRECTION REQUIRED` ou `BLOCKED`.

---

## 16. Work Orders visuais sugeridas (plano, ainda não emitidas)

> **Atenção:** repositório ainda não foi fornecido neste chat. As WOs abaixo são uma **proposta de sequenciamento**, não branches ou tarefas criadas. Após o repositório existir, ler checkpoint, decisões, Scope, DoD, Architecture e requisitos e emitir apenas a próxima WO necessária.

### `CB-VIS-WO-001` — Visual Source Lock & baseline

**OBJECTIVE:** importar golden home/logo, hashes, tokens provisórios, fixtures estáveis e harness de screenshots.  
**CONTEXT:** esta Bíblia e Master v0.6.  
**SCOPE:** assets de referência, componentes mínimos de render, CI visual basal, documentação/ADRs.  
**OUT OF SCOPE:** DeepSeek/JEV, APIs reais, publicação, analytics, novos layouts inventados.  
**FILES/SOURCES TO READ:** checkpoint, decisions, Scope, DoD, Architecture, esta Bíblia, duas imagens.  
**REQUIREMENTS:** controles de versão e referências verificáveis.  
**ARCHITECTURE RULES:** framework definido pelo Source Pack aprovado; sem CSS ad hoc não tokenizado como verdade final.  
**CONSTRAINTS:** nunca editar goldens; não afirmar layout concluído.  
**ACCEPTANCE CRITERIA:** assets no repo e hashes confirmados; screenshots de fixture reproduzíveis; testes mínimos de render/CI passam.  
**TESTS:** hash, lint, typecheck, build, screenshot básico, verificação de assets.  
**DELIVERABLES:** PR, Evidence Bundle, relatório de baseline e Checkpoint Delta proposto.  
**REVIEW FORMAT:** pt-BR com decisão e evidência.  
**STOP CONDITION:** auditoria objetiva `APPROVED`.

### `CB-VIS-WO-002` — Design system, brand SVG & header

**Objetivo:** criar tokens, materiais glass, asset do logo, icon system, header e theme/language controls. **Aceite:** revisão de overlay do header em viewport golden, dark fiel, controles acessíveis; light funcional sem alegar aprovação visual; sem asset JPEG preto recortado artificialmente como ícone.

### `CB-VIS-WO-003` — Cinematic hero fidelity

**Objetivo:** produzir asset hero + layout BreakingHero. **Aceite:** pixel-region compare com hero golden, cenas e overlays nas posições corretas, título/CTAs de fixture com line wrap semelhante, performance sob orçamento e CTAs reais no estado de integração aplicável. **Bloqueio:** não passar com um Bitcoin pequeno genérico sobre gradiente.

### `CB-VIS-WO-004` — Market, ticker, trending & categories

**Objetivo:** construir quatro módulos superiores, com SVGs e fixtures. **Aceite:** grids densos e alinhados, ranks, linhas, chips, ticker e preço sem layout shift; fonte real fica para integração posterior.

### `CB-VIS-WO-005` — Radar, sentiment & promo

**Objetivo:** concluir a faixa média com timeline, gauge SVG e promo art. **Aceite:** mesma proporção de três colunas da referência; radar 5 entries, gauge com semântica e promo asset aprovado; sem dados inventados apresentados como reais.

### `CB-VIS-WO-006` — Latest News & newsletter + full-page fidelity

**Objetivo:** terminar home 1536×864 dark e comparar integralmente. **Aceite:** mesmo número visual de cards e filtros, newsletter alinhada, captura total com diferença visual documentada por região. Sem erro HIGH/CRITICAL e sem links falsos.

### `CB-VIS-WO-007` — Motion, accessibility, responsiveness & light

**Objetivo:** adicionar motion controlado e cobrir desktop/notebook/tablet/mobile/light. **Aceite:** testes keyboard, reduced-motion, contraste e screenshots multi-viewport; light passa por revisão visual separada.

### `CB-VIS-WO-008` — Production integration and regression hardening

**Objetivo:** conectar a home a conteúdos aprovados, endpoints reais, estados de falha e métricas sem deformar layout. **Aceite:** compatibilidade de contratos, cache/erro/stale, trilíngue, Core Web Vitals e golden regression suite. Não misturar com mudanças de escopo não aprovadas.

### 16.9 Processo de execução

A seguir, por WO: `ANALYZE → SOURCE CHECK → NEXT NECESSARY INCREMENT → WORK ORDER → CONTEXT LOCK → PREFLIGHT → EXECUTOR → TESTS/EVIDENCE → PR → AUDIT → APPROVED/CORRECTION REQUIRED/BLOCKED → CHECKPOINT DELTA → MERGE → NEXT`. Cada WO real deverá conter todas as seções da instrução de engenharia do usuário e risco/classificação conforme DoD.

---

## 17. Test fixtures para reproduzir o golden

**Propósito:** congelar layout e timing no screenshot QA, não publicar fatos antigos.

| Slot visual | Texto/estado de fixture | Observação |
|---|---|---|
| Hero label | `BREAKING NEWS`, `2h ago` | Teste visual apenas |
| Hero headline | `Bitcoin Breaks $70,000 as Institutional Inflows Hit Record Highs` | Não publicar como notícia atual |
| Hero CTA | `Read Full Story`, `Watch Analysis` | Em produção, ação exige destino verdadeiro |
| Market | BTC/ETH/SOL/BNB/XRP em 5 linhas | Preços sintéticos em fixture |
| Ticker | BTC/ETH/SOL/BNB/XRP/DOGE/ADA | Preços sintéticos em fixture |
| Trending | 5 itens numerados | Headlines aprovadas/fictícias de teste |
| Categories | 10 categorias | Nomes originais do golden |
| Radar | 5 eventos com times e tags | Nenhum rumor sem revisão em produção |
| Sentiment | `78 / Greed` | Gauge sintético, índice real posterior |
| Promo | `STAY AHEAD OF THE NEXT MOVE.` | Comunicar produto existente no lançamento |
| Latest | 4 cards | Thumb, categoria, headline e excerpt |
| Newsletter | 1 campo + CTA | Testes de validação/estado |

**Config de screenshot:** relógio fake fixo, moeda USD para as fixtures do golden, inglês, tema dark, no API e com animações congeladas. Diferenciar *mock data* de *test verified production data* em código e evidência.

---

## 18. Critérios de conclusão por região (Definition of Visual Done)

Checklist de aceite obrigatório por módulo visual:

- [ ] Corresponde à região e função no golden, sem reordenamento arbitrário.
- [ ] Bounding box registrada e diferença validada.
- [ ] Tipografia aproximada com line breaks equivalentes em inglês.
- [ ] Assets e ícones corretos e suas licenças rastreáveis.
- [ ] Glassmorphism, blur, border e glow com contraste adequado.
- [ ] Estado hover, focus, loading, empty, error e stale tratado quando aplicável.
- [ ] Ação de cada controle real ou controle explicitamente ausente até a funcionalidade existir.
- [ ] Mobile/tablet, light e reduced-motion sem quebrar conteúdo.
- [ ] A11y básica e semântica testadas.
- [ ] Screenshot de evidência anexado por região.
- [ ] Lint/typecheck/build/test aplicáveis verdes.
- [ ] Nenhuma informação sintética apresentada ao público como real.
- [ ] Auditoria independente com `APPROVED`; delta de checkpoint proposto, não autoaprovado.

A versão de design só está **VALIDADA** quando esses pontos forem satisfeitos no escopo do DoD. Esta Bíblia sozinha **não é evidência de implementação**.

---

## 19. Padrões proibidos / anti-deriva

1. Trocar o hero por slider de cards sem cena Bitcoin.
2. Colocar logo como texto qualquer + ícone Lucide e chamar de identidade aprovada.
3. Usar a imagem inteira de 1536×864 como plano de fundo final da home.
4. Usar screenshot recortado como notícia falsa.
5. Transformar toda a home em React hidratado sem justificativa.
6. Instalar Three.js/GSAP apenas por estética, sem benchmark.
7. Usar CSS global solto, com cores divergentes a cada módulo.
8. Usar cards cinza claro e bordas neon grossas no dark.
9. Alargar espaçamentos, quebrar as barras e desorganizar a dobra.
10. Dizer `pixel perfect` sem screenshot comparável, overlay e revisão.
11. Publicar preços/manchetes/datas do mockup como informação ao vivo.
12. Afirmar `CoinBlink` registrada/exclusiva sem clearance.
13. Abusar de animações, brilho ou métricas inventadas para parecer profissional.
14. Ocultar opções de linguagem e tema que o usuário exigiu desde o início.
15. Promover etapas posteriores com defects `HIGH/CRITICAL` conhecidos.
16. Misturar migração de infraestrutura, marketing, ingestão de APIs e fidelidade UI na mesma WO sem necessidade demonstrada.

---

## 20. Perguntas e decisões pendentes (não inventar respostas)

| Pendente | Motivo | Próxima ação |
|---|---|---|
| Registro/licença e disponibilidade de marca/logo | Risco de conflito com Coinwink/outros | Pesquisa formal conforme jurisdição, marca e domínios |
| Identificação tipográfica exata | Imagem não informa arquivo de fonte | Comparar fontes licenciadas com screenshot |
| Paleta final pixel-aproximada | Glow e compressão JPEG mascaram cores | Amostragem por região e inspeção visual |
| Hero render definitivo | Golden é imagem composta | Recriar asset com camadas, comparar e aprovar |
| SVG final do logo | Original é raster com fundo escuro | Vetorizar e submeter comparação |
| Light golden | Não existe referência aprovada | Criar versão clara após dark e pedir aprovação |
| Mobile golden | Não existe referência aprovada | Criar layout compatível e pedir aprovação |
| Valores reais do sentimento | Provedor/API pode ter schema diferente | Contrato de dados e legenda legítima |
| Futuros anúncios | Modelo comercial de banners, sem espaços intrusivos | Política comercial e layout específico |
| Comportamento de vídeos | `Watch Analysis` depende de vídeo real | Definir mídia/CTA viável para MVP |

**Política:** nenhuma pendência bloqueia a criação documental. Ações legais, integrações pagas ou publicação comercial requerem suas aprovações/contratos pertinentes.

---

## 21. Instruções para importar no GitHub quando o repo existir

1. Criar a estrutura do Source Pack versionado **antes de implementação**, obedecendo a hierarquia do projeto e aos padrões do usuário: README/Source Hierarchy, Overview, Requirements, Scope, Architecture, Security, Test Plan, Deployment, Backlog, DoD, Decisions/ADRs e Checkpoint, mais arquivos necessários.
2. Inserir esta Bíblia em `docs/design/` (ou caminho canônico definido pela arquitetura), com **hash e caminho** das duas referências aprovadas.
3. Copiar `assets/reference/` para `design/reference/` ou `docs/design/reference/`; manter originais binários exatamente iguais.
4. Registrar decisão formal de que a imagem dark enviada é a Visual Master, sem declarar que o site já está fiel ou funcional.
5. Não modificar documentos canônicos previamente aprovados. Se houver divergência no Source Pack, aplicar o fluxo de auditoria e atualizar somente após `APPROVED`.
6. Configurar CI com hash assets, lint, typecheck, build, Playwright, acessibilidade, performance conforme risco.
7. Emitir **apenas a primeira WO necessária** após source check e checkpoint, usando ID estável.
8. Executor deve inspecionar repo, implementar apenas WO, testar, commitar, push, PR e Evidence Bundle. Revisão em português brasileiro.
9. Enviar screenshots comparativos da referência vs implementação a cada incremento UI.
10. Não realizar alterações destrutivas de Git nem merge sem cumprir as regras do projeto.

---

## 22. Design review format pronto para uso

```markdown
# CoinBlink Visual Audit — CB-VIS-WO-###
- Status: APPROVED | CORRECTION REQUIRED | BLOCKED
- Base SHA / Head SHA:
- Visual master SHA-256:
- Evidence directory:
- Implemented components:
- Viewports/Browser/DPR:
- Screenshot overlays by region:
- Layout geometry differences:
- Typography/contrast/assets:
- Interaction/accessibility checks:
- Unit / lint / typecheck / build / E2E / visual:
- Performance deltas:
- Known risks and severity:
- Exact correction delta (if any):
- Proposed checkpoint delta:
- Independent reviewer/date:
```

---

## 23. Sumário executivo para a equipe de implementação

**Queremos:** uma home CoinBlink editorial-financeira dark, idêntica na organização à referência do usuário, com hero Bitcoin cinematográfico e texto vivo, painel direito de cinco ativos, ticker, tendências, categorias, Radar 24h, sentimento semicircular, promo, últimas notícias e newsletter. O logo olho/moeda/raio já foi **escolhido visualmente**. O produto é en-first, com pt-BR/es desde a arquitetura.

**Faremos com:** Astro/React/TypeScript/Tailwind, CSS/SVGs personalizados, Motion, imagens premium produzidas offline, Playwright para screenshot/regressão; JEV/DeepSeek alimentam conteúdo via serviços separados e não definem render ou paleta.

**Validaremos com:** a imagem de 1536×864 e a imagem do logo versionadas, hashes, recortes, QA por módulo, screenshot determinístico, overlay e auditoria. A **fidelidade é requisito mensurável**, não uma promessa estética vaga.

**Não faremos agora:** construir repo sem endereço, instalar ferramentas no ambiente do usuário, integrar APIs pagas, inventar artigos reais ou declarar o projeto concluído.

---

## 24. Changelog

### v1.0.0 — 2026-10-08

- Primeira versão detalhada da **Design Bible visual** do CoinBlink.
- Registradas como fontes imutáveis a home dark 1536×864 e o logo original 1179×1040 escolhidos pelo usuário.
- Criado mapa inicial com onze regiões e sub-recortes por inspeção.
- Detalhados tokens de cor, tipografia, SVG, glassmorphism, animação, hero/3D, componentes, responsividade e light mode.
- Formalizadas estratégias de asset pipeline, visual fidelity, acesso, performance, testes e processo de WOs.
- Nenhum status `IMPLEMENTED`, `TESTED` ou `DEPLOYED` atribuído a módulos do site.

---

## Apêndice A — Índice dos recortes do golden

| ID | Recorte | Onde observar |
|---|---|---|
| 01 | `regions/01-header-and-navigation.png` | Marca, navegação, busca, idiomas, toggle |
| 02 | `regions/02-featured-hero.png` | Texto hero, imagem, dados de destaque |
| 03 | `regions/03-live-market-overview.png` | Linhas, preços, sparklines, cabeçalho |
| 04 | `regions/04-market-ticker.png` | Alinhamento financeiro horizontal |
| 05 | `regions/05-trending-now.png` | Rankings compactos e separadores |
| 06 | `regions/06-category-shortcuts.png` | Ícones e densidade |
| 07 | `regions/07-radar-24h.png` | Timeline, chips e linhas |
| 08 | `regions/08-market-sentiment.png` | Arco de sentimento, legenda e posição |
| 09 | `regions/09-editorial-promo-card.png` | Arte editorial, halo, CTA |
| 10 | `regions/10-latest-news.png` | Miniaturas, tabs e textos |
| 11 | `regions/11-newsletter.png` | Formulário e fundo |
| 12 | `regions/12-hero-image-detail.png` | Bitcoin 3D e iluminação |
| 13 | `regions/13-hero-text-detail.png` | Tipografia e CTAs |
| 14 | `regions/14-logo-header-detail.png` | Logo reduzido no header |

**Fim da Design Bible.**