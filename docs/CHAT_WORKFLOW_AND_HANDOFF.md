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

O caminho padrão para cada PR é: **análise técnica automatizada** (Copilot Code Review quando disponível no plano contratado, SonarCloud, Socket e testes aplicáveis), investigação de findings reais com Correction Delta mínimo, conferência de HEAD/base/escopo e zero threads bloqueantes, seguida de **autorização específica do proprietário para cada squash merge**. Verificar **Build (Ubuntu)**, **SonarCloud Code Analysis** e **Socket Security: Pull Request Alerts**, além de **todos os checks aplicáveis e obrigatórios na configuração atual do GitHub**. A `main` também contém **PR Assurance** read-only (scope, review, quality) e **CI Quality** (lint/typecheck, testes Node/LCOV, Gitleaks), integrados pelas PRs #173 e #176; testes de módulos também se aplicam conforme o diff. Os três checks históricos **não são uma lista exaustiva** de toda a CI. Um status `SUCCESS/Skipped` não comprova execução do scanner. CodeRabbit é complementar; skipped/rate-limited não é aprovação. Pareceres de IA não são `APPROVED` humano.

**Importante:** a política de colaboração não altera `branch protection` ou regras de `ruleset` no GitHub. Cumprir a aprovação independente quando exigida pela decisão específica do proprietário ou pela proteção efetiva; se faltar evidência ou algum gate obrigatório falhar, manter o merge `BLOCKED`. A API administrativa pode retornar HTTP 403: isso não prova ausência de proteção nem autoriza sua dispensa. Preservar todos os checks aplicáveis, sem bypass, autoaprovação, auto-merge ou conta alternativa para contornar controles. Nenhuma mudança neste documento autoriza deploy, publicação, dados LIVE, D1 remoto, GEF ou promoção de checkpoint.

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

## Limites

- Este guia **não substitui** `README.md`, `docs/BUILD_FIRST.md`, testes nem controles de segurança.
- Não instalar/recriar GEF. Não inventar funcionalidades LIVE, disponibilidade de ferramentas ou confirmação de publicação.
- Não interpretar uma escolha de interface como consentimento para qualquer ação além da mensagem efetivamente enviada pelo usuário.
