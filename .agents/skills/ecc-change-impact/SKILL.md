---
name: ecc-change-impact
description: Analise o impacto de mudanças cross-module, contratos, persistência e segurança no CoinBlink, rastreando consumidores reais e testes proporcionais.
---
# ECC experimental · Change Impact

Adaptado metodologicamente de affaan-m/ECC@90606c8315ee09cafc303515c5f33024db6b9882 sob MIT. Esta skill NÃO instala ECC nem substitui o AGENTS.md, os checks ou a política Solo Owner do CoinBlink.

## Quando ativar
Use antes de editar contratos compartilhados, imports entre módulos, autenticação/WebAuthn, CMS, RLS, dados locais ou interfaces com efeito em vários consumidores. Para um ajuste isolado, faça análise breve; não crie cerimônias, novas WOs nem documentos exigidos por padrão.

## Protocolo
1. Defina o contrato anterior, os arquivos autorizados e o comportamento que não deve mudar.
2. Identifique entrypoints, imports estáticos/dinâmicos, exports, rotas, callers e consumidores reais. Examine arquivos, não apenas nomes. Não presuma dependência pela semelhança de módulos.
3. Separe consumidores diretos, dependências transitivas, persistência/estado, autorização, acessibilidade e segurança. Marque arestas não verificadas como UNVERIFIED.
4. Relacione cada superfície afetada aos testes que **já existem** (Node Test Runner, Astro, Playwright, checks específicos). Proponha novo teste somente se houver lacuna verificável.
5. Após a implementação, compare diff, caminhos e mudanças de contratos com o mapa e valide os checks aplicáveis no HEAD efetivo. Relate explicitamente os testes NOT_RUN ou ausentes.

## Saída esperada
Tabela curta: arquivo/contrato | evidência de dependência | risco | teste correspondente | status PASS/FAIL/NOT_RUN/UNVERIFIED. Inclua SHAs e links quando disponíveis; nunca invente tempos, passes ou reviews.

## Limites
Sem instalação, hooks, chamadas externas, secrets, dados reais, deploy, merge ou uso de juízes privados sem autorização separada. Se só houver documentação ou análise estática, não declare equivalência funcional nem cobertura comprovada.
