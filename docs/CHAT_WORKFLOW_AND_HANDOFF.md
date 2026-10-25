# CoinBlink · Padrão de conversa interativa e handoff

**Preferência confirmada pelo proprietário em 2026-10-19.**
Este documento orienta a colaboração nos chats do CoinBlink. É uma **preferência de experiência de trabalho**, não uma ferramenta de governança, GEF, bloqueio ou autorização permanente.

## Como devem ser as respostas do assistente

- Responder em português brasileiro, de forma objetiva, calorosa, com explicação acessível do que foi realmente executado e do que falta.
- **Nas respostas finais, sempre que houver um próximo passo possível, incluir ao menos um botão clicável de decisão ou autorização.** Se houver duas escolhas verdadeiras, oferecer alternativas claras (por exemplo, “Autorizar integração” e “Revalidar CI”); se nenhum botão funcional for suportado pelo cliente, apresentar instruções textuais equivalentes prontas para copiar.
- Não criar botões decorativos, sem efeito real ou para ações não suportadas.
- Se a próxima ação exigir autorização nova, o botão deve enviar uma mensagem explícita de autorização para o chat, **não deve alegar que já executou a ação**. O assistente executará a ação apenas após o usuário enviar/aprovar a mensagem e os controles serem revalidados.
- Manter o botão próximo ao fim da resposta, precedido de resultados e riscos principais. Quando o usuário disser “continue”, trabalhar efetivamente dentro do escopo e trazer nova escolha na resposta.
- Preferir commits/PRs pequenos que produzam funcionalidades reais, com CI e correção dos erros detectados, evitando ciclos vazios de planejamento.

## Modelo Solo Owner (decisão do proprietário, 2026-10-19)

O CoinBlink é desenvolvido sob responsabilidade de um único proprietário. **Por padrão, não exigir, recrutar nem convidar um segundo humano para revisão de PR como etapa obrigatória do processo interno.** Exceções: revisão independente expressamente exigida pelo proprietário para a PR/HEAD, ou aprovação humana exigida pelas regras efetivas de proteção do GitHub. Não transformar aprovações específicas, como as das PRs #176 e #183, em requisito universal. Não conceder `write`, solicitar revisores externos ou transferir responsabilidade sem autorização específica. Uma conta alternativa controlada pelo mesmo proprietário não constitui revisor independente.

O caminho padrão para cada PR é: **análise técnica automatizada** (Build, SonarCloud, Socket, CI Quality, PR Assurance, reviewdog/ESLint e testes de módulos aplicáveis), investigação de findings concretos com Correction Delta mínimo, conferência do HEAD/base/escopo, zero threads bloqueantes e **autorização específica do proprietário para cada squash merge**. Verificar **Build (Ubuntu)**, **SonarCloud Code Analysis** e **Socket Security: Pull Request Alerts**, além de **todos os checks aplicáveis e obrigatórios na configuração atual do GitHub**. A `main` também contém **PR Assurance** read-only (scope, review, quality), **CI Quality** (lint/typecheck, testes Node/LCOV, Gitleaks) e, desde a PR #184, **Reviewdog / ESLint annotations (read-only)**. Os três checks históricos **não são uma lista exaustiva** de toda a CI. Um status `SUCCESS/Skipped` não comprova execução do scanner.

**Reviewdog é revisão estática complementar, não IA semântica nem aprovação independente:** publica diagnósticos ESLint conforme a configuração real do workflow; não comprova ausência de bugs de lógica, falhas de autorização ou riscos contextuais. `PR Assurance / review (read-only)` é diagnóstico e não aprovação formal. Análises pontuais por ChatGPT/Codex ou outra ferramenta são opcionais ou proporcionais ao risco; não substituem um revisor independente quando ele for exigido por autorização expressa para aquela PR/HEAD ou pela proteção efetiva do GitHub.

**CodeRabbit não é dependência operacional nem gate de merge do fluxo padrão.** Não aguardar quota, não solicitar `@coderabbitai review`, não comprar créditos e não tratar status pendente, limite de quota ou ausência desse bot como bloqueio por si. Comentários antigos de CodeRabbit podem permanecer como evidência histórica e seus achados reais devem continuar corrigidos, mas não criam uma obrigação contínua de usar o serviço. Qualquer integração, instalação ou uso futuro de serviço pago depende de autorização separada. Pareceres de IA não são `APPROVED` humano.

**Autorizações excepcionais anteriores não são revogadas retroativamente:** se o Owner exigiu revisão independente para uma PR/HEAD específico, inclusive a PR #181, esse requisito permanece até ser cumprido ou substituído por uma nova decisão explícita do Owner para aquela PR. Uma alternativa de revisão deve ser tecnicamente substantiva e auditável, sem autoaprovação, conta alternativa do mesmo Owner ou bypass de proteção.

**Importante:** a política de colaboração não altera `branch protection` ou regras de `ruleset` no GitHub. Cumprir a aprovação independente quando exigida pela decisão específica do proprietário ou pela proteção efetiva; se faltar evidência ou algum gate obrigatório falhar, manter o merge `BLOCKED`. A API administrativa pode retornar HTTP 403: isso não prova ausência de proteção nem autoriza sua dispensa. Preservar todos os checks aplicáveis, sem bypass, autoaprovação, auto-merge ou conta alternativa para contornar controles. Nenhuma mudança neste documento autoriza deploy, publicação, dados LIVE, D1 remoto, GEF ou promoção de checkpoint.

### Preferência permanente: `@kayzenweb3` como revisor técnico delegado (decisão 2026-10-25)

**Registro persistente:** [Issue #248](https://github.com/KayzenRoot/coinblink/issues/248). Esta subseção é uma preferência operacional do Owner, **não** altera as exigências legais, humanas ou técnicas do projeto.

- Usar automaticamente a conta GitHub conectada `kayzenweb3` como **primeira opção de revisão técnica interna** quando o GitHub e a integração permitirem. A conta tem permissão `write` e foi explicitamente indicada pelo proprietário. Não pedir repetidamente qual segunda conta usar em revisões técnicas rotineiras; reconfirmar apenas permissão, elegibilidade, HEAD e escopo em cada PR.
- Quando suportado, solicitar a revisão pelo GitHub e usar parecer técnico `COMMENT` claramente atribuído como **assistido por IA** se o texto for produzido por ferramentas. Nunca inventar que uma revisão foi executada, que houve assinatura humana ou que um `COMMENT` equivale a `APPROVED`.
- **Conta alternativa não é auditor humano independente apenas por possuir outro login.** Sob exigência de revisão independente para uma PR específica, comprovar independência real de pessoa/relacionamento e revisão substantiva ancorada ao HEAD, ou manter o gate `BLOCKED`; a delegação para `kayzenweb3` não remove automaticamente essa exigência. Isso vale especificamente para a PR #233 até nova decisão explícita do Owner para seu escopo LOCAL-only.
- Os controles padrão permanecem: Build, SonarCloud, Socket, CI, Gitleaks, Reviewdog, testes e proteções aplicáveis; sem bypass, auto-merge, alteração de `main`, ativação de credenciais reais, D1 remoto, deploy, custos, alterações de direitos ou promoção de checkpoints por causa dessa preferência.
- **Estado verificado na PR #233:** `kayzenweb3` foi solicitado formalmente como revisor mantendo a PR em Draft, HEAD `54b84ea2041571df936c5092b26a6663dc6fa8b8`; uma tentativa de submeter `COMMENT` pela conta através da ferramenta GitHub retornou `link_id must identify an eligible linked account`. Registrar `NOT_SUBMITTED` e não reproduzir a tentativa até a elegibilidade da ferramenta mudar. As duas revisões anteriores eram `COMMENTED`, não aprovação humana independente.
- Quando uma revisão humana externa específica for exigida e não houver profissional elegível identificado, continuar todo o trabalho técnico permitido, registrar o impedimento com precisão e oferecer uma escolha clara; **não criar ciclos de perguntas sobre a conta revisora já delegada**. Também não tratar a delegação como agendamento de verificações contínuas: cada execução por chat ou CI depende da disponibilidade real das ferramentas.
## Modelo de autorização para PR

**Ao oferecer merge, usar um botão com mensagem estruturada** contendo, quando conhecidos:
- Repositório `KayzenRoot/coinblink`, número da PR e SHA do HEAD **completo e exato**.
- SHA da `main` usado como base, quantidade e resultado dos checks, zero threads pendentes, integridade do diff e caminhos/quantidade de arquivos.
- Operação **squash merge** condicionada à **reconfirmação imediatamente antes da execução** dessas condições, mais `mergeable=true`.
- Após o merge, permitir **auditoria pós-merge** e apenas o próximo trabalho expressamente autorizado.
- Restrições padrão para incrementos locais: **sem deploy, publicação, feeds/cotações LIVE, D1 remoto, Owner real de produção, GEF ou promoção de checkpoint**.

**Exemplo de texto enviado pelo botão (substituir placeholders por valores auditados):**

> Autorizo especificamente o squash merge da PR #<numero> de KayzenRoot/coinblink no HEAD <sha>, condicionado à reconfirmação da main <sha-main>, dos <n> checks aprovados, zero threads pendentes e diff restrito aos <n> arquivos autorizados. Após o merge, autorizo auditoria pós-merge e planejamento do próximo incremento local. Sem deploy, publicação, dados LIVE, D1 remoto, GEF ou promoção de checkpoint.

Para desenvolvimento e correção de bugs, oferecer botão “Autorizar implementação ...” com escopo e limites, ou “Continuar por aqui” quando a continuação já está permitida. Nenhuma preferência visual anula segurança, regras GitHub ou necessidade de autorização específica para merges.

## Handoff: iniciar um novo chat sem perder o padrão

O usuário pode escrever:

> Continue o CoinBlink em `KayzenRoot/coinblink`. Leia `AGENTS.md`, `docs/BUILD_FIRST.md` e `docs/CHAT_WORKFLOW_AND_HANDOFF.md`, confira a `main`, as PRs abertas e o estado atual das Issues #147 e #160. Siga o padrão de **botões clicáveis de autorização e escolha no fim das respostas**. Execute tudo que puder por aqui, preserve segurança e não faça merges sem autorização específica.

A leitura automática dos documentos de repositório **não é garantida em conversas novas**. Os arquivos são referência persistente para o usuário solicitar a continuidade e para ferramentas que leem o GitHub. Em conversas de outros projetos, o usuário pode pedir “use o mesmo padrão de botões do CoinBlink”.

## Situação do produto quando este arquivo foi criado

- Histórico: `main` depois da PR #159 era `64916a98c2c233912a273f85f4953008f26d6378`; após a PR #183 (2026-10-21) era `be07976b702ccf824dbfd06b19704820f36e6b20`. **Ambos são registros históricos: consultar GitHub para confirmar o HEAD atual** antes de qualquer operação futura.
- M01: Home com navegação EN/PT e jornada local integrada.
- M02: notícias **fictícias** EN/PT, não publicadas.
- M03: laboratório de fontes **sintéticas**, sem licenciamento real.
- M04: laboratório de mercados/radar **sem preços LIVE**.
- M05: CMS de rascunhos **D1 LOCAL** e identidade WebAuthn **sintética**; `/admin` público continua bloqueado.
- M06-A: indicadores locais protegidos e medidos apenas da listagem de rascunhos.
- M06-B: revisões e atividade editorial protegida.
- M06-C: fila de revisão **LOCAL** com crédito ausente, fontes `SOURCE_VERIFICATION_PENDING` e filtros. PR #159 integrada após 7/7 checks e diff de quatro arquivos.
- [Issue #147](https://github.com/KayzenRoot/coinblink/issues/147) encerrada como `completed` em 2026-10-20. O encerramento da issue **não comprova, por si, a correção do Security Rating D histórico**; verificar o SonarCloud atual antes de afirmar que foi resolvido.
- Preferência UX registrada também na [Issue #160](https://github.com/KayzenRoot/coinblink/issues/160).

A **fonte da verdade operacional é sempre o repositório na data da próxima sessão**, não os SHAs históricos deste handoff.

## Fluxo simplificado Chat + Codex (preferência atualizada em 2026-10-20)

- **Chat é o centro de decisões.** Repositório GitHub é fonte persistente de handoffs; Codex executa tarefas externas ou complexas. Não exigir troca para Work para dar continuidade.
- Quando uma missão precisar de instruções ou arquivos, criar documento de handoff em **branch documental própria, com PR sem merge**. Entregar no chat o link GitHub e um prompt curto para Codex ler o documento diretamente por ref/URL verificados, dispensando downloads e anexos manuais.
- O Codex poderá salvar **evidências sanitizadas diretamente em branch/PR especificamente autorizada**, depois de verificar confidencialidade e segredos. Nunca gravar vulnerabilidades exploráveis não corrigidas em repositório público.
- As permissões da missão devem ser explícitas: escopo de leitura/escrita, caminhos permitidos, STOP CONDITION e proibição de merge/deploy por padrão. Nenhum handoff autoriza fusão automática, mudança de Quality Gate ou operação LIVE.
- A investigação SonarCloud #147 foi registrada em 2026-10-20. Consultar [handoff Codex](operations/CODEX_SONAR_147_READONLY.md), [relatório agregado histórico](audits/sonar/issue-147/report.md) e [status histórico](audits/sonar/issue-147/status.json). A Issue #147 foi encerrada e a PR #180 integrada posteriormente; revalidar o estado atual. A PR #182 permanece um relatório público alternativo em Draft, não a fonte canônica deste handoff. Qualquer nova investigação, escrita ou divulgação exige autorização específica.

## Limites

- Este guia **não substitui** `README.md`, `docs/BUILD_FIRST.md`, testes nem controles de segurança.
- Não instalar/recriar GEF. Não inventar funcionalidades LIVE, disponibilidade de ferramentas ou confirmação de publicação.
- Não interpretar uma escolha de interface como consentimento para qualquer ação além da mensagem efetivamente enviada pelo usuário.
