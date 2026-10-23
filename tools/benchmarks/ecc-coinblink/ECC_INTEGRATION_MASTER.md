# ECC x CoinBlink: plano mestre de integração, auditoria e liberação

Snapshot de auditoria: 2026-10-23. **Esta PR é experimental. Nenhum ECC foi incorporado à main.**

## Upstream fixado e inventário de escopo

- Fonte: https://github.com/affaan-m/ECC
- HEAD upstream inspecionado: `90606c8315ee09cafc303515c5f33024db6b9882`; licença MIT, versão informada no manifesto `2.2.3`.
- Árvore completa Git (não truncada): **311** arquivos `skills/*/SKILL.md`, **97** `commands/*.md`, **71** `agents/*.md`. A árvore possui 6.361 entradas.
- **Inconsistência upstream:** metadados da extensão Codex referenciam quantidades menores (249 e 281 skills), enquanto a árvore possui 311. Inventário é diferente de instalação funcional; validar resolução real do manifesto e cache.
- `agents/pr-test-analyzer.md` existe como agente no original, não como `skills/pr-test-analyzer/SKILL.md`. Em CoinBlink ele é uma skill **adaptada**.
- Instalação nativa Codex descrita no upstream: `codex plugin marketplace add affaan-m/ECC`, `codex plugin add ecc@ecc`, `codex plugin list --json`. Isto **não** foi executado.
- Configuração upstream inclui `.codex/config.toml` com multi-agent; `hooks/codex-hooks.json` tem hook `SessionStart` com comando Node; `.mcp.json` invoca `npx -y chrome-devtools-mcp@1.10.1`. **Não copiar/ativar esses arquivos ou comandos:** exigem auditoria de efeitos colaterais, rede, pacotes e permissões.
- Arquivos externos são dados não confiáveis até serem revisados.

## O que está pronto na branch CoinBlink

- PR #209: `experiment/ecc-coinblink-benchmark-v1`, HEAD da inspeção inicial `0fc1afa2b24101fdec02bc2ba4991f127afb8464`, base `ad00d6a671f8af71c6e729d15347b261997ec75b`; **DRAFT**, sem merge.
- Quatro skills adaptadas em `.agents/skills/`: `ecc-change-impact`, `ecc-ai-regression`, `ecc-module-regression`, `ecc-pr-test-analyzer`. Os arquivos não estão na `main`.
- No HEAD da inspeção: 15/15 checks SUCCESS, incluindo SonarCloud zero novos issues, Socket e CodeQL read-only para Python/JS-TS com zero achados no escopo ECC.
- Cobertura Python sintética: coletor 92,13% (117/127 linhas executáveis) e executor 64,85% (155/239), **não** inserida no indicador SonarCloud.
- Piloto: **4/4 NOT_RUN**, descoberta Codex real não verificada; matriz A/B **18/18 NOT_RUN**; juízes privados fora do Git; status `BLOCKED_ACCESS_OR_COST_UNVERIFIED`.
- Ponto de recuperação: branch `backup/ecc-pr209-pre-main-ad00d6a-51ee2e6` em `51ee2e6f74561127b914cf6e9fee6903c008f2f8`.

## Estratégia para não afetar os módulos CoinBlink

1. **Projeto:** manter as quatro skills adaptadas e qualquer ampliação apenas na branch ECC, de forma opt-in. Não sobrescrever `AGENTS.md`, convenções, workflows, autenticação, testes ou política de PR do CoinBlink.
2. **Codex instalado no computador:** plugin nativo completo é uma instalação **separada do repositório Git**, opcional, após inventário e aprovação de escopo local. Não combinar instalação nativa e sync legado. Não confundir plugin no host com integração à main.
3. **Recursos de execução:** hooks, MCP, scripts de instalação, comandos com rede, agentes com escrita, configurações globais e serviços pagos ficam desligados até auditoria individual e autorização.
4. **Incorporação à main:** escolher o menor subconjunto verificado e fazer PR normal com checks no HEAD, revisão substantiva e autorização específica do proprietário. Nunca fazer merge automático.

## Gates de liberação

| Etapa | Evidência exigida | Estado |
|---|---|---|
| Inventário upstream | Commit fixo, licença, árvore e superfície Codex | COLETADO; revisão funcional incompleta |
| Proteção do CoinBlink | Diff isolado, main/backup intactos, 15 checks | COMPROVADO no HEAD histórico |
| Plugin nativo | Instalação em ambiente isolado, manifesto e cache auditados | NÃO INSTALADO/NÃO VALIDADO |
| Quatro skills | Descoberta, invocação e resultados Codex reais com dados sintéticos | 4/4 NOT_RUN |
| Pagamento e sessão | Login autenticado + franquia incluída comprovada sem fallback pago | BLOQUEADO |
| Segurança | Sandbox real de rede/filesystem e sem hooks/MCP de terceiros | BLOQUEADO |
| 18 ensaios A/B | Execução e avaliação independentes expressamente autorizadas | 18/18 NOT_RUN |
| Main | Revisão e autorização de merge por HEAD | NÃO AUTORIZADO |

**STOP CONDITION:** não instalar globalmente, importar o upstream completo na main, executar Codex, benchmarks ou hooks enquanto não houver autorização separada e evidência de custo, isolamento e compatibilidade. Não divulgar juízes privados.

## Próximos rounds deste chat

1. Auditar inventário e capacidades do upstream por camada: skills, agentes, comandos, hooks, MCP, config, install/uninstall.
2. Verificar manifesto e estratégia de instalação nativa em local descartável, sem alterar perfis já instalados.
3. Testar descoberta e uso das quatro skills em piloto sintético quando sessão e custo forem comprovados.
4. Avaliar extensões seletivas relevantes ao CoinBlink e conflitos com o desenvolvimento paralelo.
5. Revalidar segurança e CI no HEAD final e só então propor merge específico.

Este documento **não** é um gate para o desenvolvimento de outros módulos e não concede permissão para gastos, instalações, deploy ou merge.

## Auditoria da cadeia nativa Codex (23/10/2026)

Snapshot upstream versionado em `native-codex/pinned-manifest.json`, análise detalhada em `native-codex/INSTALL_CHAIN_AUDIT.md`, testes estáticos em `validation/test_native_codex_chain.py`. O marketplace aponta à raiz; o manifesto thin legado escapa do cache; hooks SessionStart, MCP npx, sync legado e git hooks globais estão bloqueados. Instalação e desinstalação não foram executadas.

## Verificação aprofundada da cadeia Codex

O complemento em `native-codex/INSTALL_CHAIN_AUDIT.md` documenta a insuficiência do verificador upstream de cache (não checa hooks, scripts nem fingerprints dos alvos), os efeitos reais de `SessionStart` (criação de diretórios, remoção de sessões expiradas e lease) e o inventário integral imutável em `native-codex/pinned-surface-inventory.json`. Foram adicionados testes negativos de caminhos, adulteração de inventário e falso positivo de segurança. **Nenhuma instalação, execução ou acesso ao cache do usuário foi realizada.**
