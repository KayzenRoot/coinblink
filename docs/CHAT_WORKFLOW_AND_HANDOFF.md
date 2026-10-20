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

O CoinBlink é desenvolvido sob responsabilidade de um único proprietário. **Não exigir, recrutar nem convidar um segundo humano para revisão de PR como etapa obrigatória do nosso processo de trabalho.** Não conceder `write`, solicitar reviewers externos ou transferir responsabilidade sem uma nova autorização específica. O proprietário não precisa usar outras contas próprias para simular independência.

O caminho padrão para cada PR é: **análise técnica automatizada** (Copilot Code Review quando disponível dentro do plano já contratado, SonarCloud, Socket e testes aplicáveis), análise de findings reais com Correction Delta mínimo, confirmação de **Build (Ubuntu)**, **SonarCloud Code Analysis** e **Socket Security: Pull Request Alerts** como três gates imutáveis, conferência de HEAD/base/escopo e zero threads bloqueantes, seguida de **autorização específica do proprietário para cada squash merge**. CodeRabbit é apenas complementar; review skipped/rate limited não é aprovação. Pareceres de IA não são `APPROVED` humano.

**Importante:** remover a exigência do *processo de colaboração* não altera automaticamente as regras de branch protection no GitHub. Se a proteção real ainda exigir aprovação humana, manter o merge BLOCKED e informar a necessidade de adequação administrativa. A integração GitHub atual não tem permissão de administração para alterar essa regra; não fingir que foi removida. Preservar os três checks e nunca usar bypass, autoaprovação, auto-merge ou uma conta alternativa para contornar a proteção. Nenhuma mudança neste documento autoriza deploy, publicação, dados LIVE, D1 remoto, GEF ou promoção de checkpoint.

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

> Continue o CoinBlink em `KayzenRoot/coinblink`. Leia `AGENTS.md`, `docs/BUILD_FIRST.md` e `docs/CHAT_WORKFLOW_AND_HANDOFF.md`, confira a `main`, as PRs abertas e as Issues #147 e #160. Siga o padrão de **botões clicáveis de autorização e escolha no fim das respostas**. Execute tudo que puder por aqui, preserve segurança e não faça merges sem autorização específica.

A leitura automática dos documentos de repositório **não é garantida em conversas novas**. Os arquivos são referência persistente para o usuário solicitar a continuidade e para ferramentas que leem o GitHub. Em conversas de outros projetos, o usuário pode pedir “use o mesmo padrão de botões do CoinBlink”.

## Situação do produto quando este arquivo foi criado

- `main` depois da PR #159: `64916a98c2c233912a273f85f4953008f26d6378`. **Consultar GitHub para confirmar o HEAD atual** antes de qualquer operação futura.
- M01: Home com navegação EN/PT e jornada local integrada.
- M02: notícias **fictícias** EN/PT, não publicadas.
- M03: laboratório de fontes **sintéticas**, sem licenciamento real.
- M04: laboratório de mercados/radar **sem preços LIVE**.
- M05: CMS de rascunhos **D1 LOCAL** e identidade WebAuthn **sintética**; `/admin` público continua bloqueado.
- M06-A: indicadores locais protegidos e medidos apenas da listagem de rascunhos.
- M06-B: revisões e atividade editorial protegida.
- M06-C: fila de revisão **LOCAL** com crédito ausente, fontes `SOURCE_VERIFICATION_PENDING` e filtros. PR #159 integrada após 7/7 checks e diff de quatro arquivos.
- Problema real ainda acompanhado: [Issue #147](https://github.com/KayzenRoot/coinblink/issues/147), SonarCloud Security Rating D na `main`. **Não presumir que tenha sido corrigido** sem checar o novo resultado.
- Preferência UX registrada também na [Issue #160](https://github.com/KayzenRoot/coinblink/issues/160).

A **fonte da verdade operacional é sempre o repositório na data da próxima sessão**, não os SHAs históricos deste handoff.

## Limites

- Este guia **não substitui** `README.md`, `docs/BUILD_FIRST.md`, testes nem controles de segurança.
- Não instalar/recriar GEF. Não inventar funcionalidades LIVE, disponibilidade de ferramentas ou confirmação de publicação.
- Não interpretar uma escolha de interface como consentimento para qualquer ação além da mensagem efetivamente enviada pelo usuário.
