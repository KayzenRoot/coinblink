# ECC Codex nativo: auditoria da cadeia de instalação

**Somente fontes e testes estáticos. Não foi instalado nenhum plugin, nem executado Codex, hook, MCP, script de instalação ou sincronização.**

## Proveniência
- Upstream fixo: https://github.com/affaan-m/ECC/tree/90606c8315ee09cafc303515c5f33024db6b9882
- Árvore: 9172b168b070a802bbc0a7c53a4ca968e761a8c6; completa, 6.361 itens; 311 skills, 71 agentes e 97 comandos.
- Snapshot minimizado com Git blob SHA e metadados: `pinned-manifest.json`. Não inclui comandos de hook executáveis.
- Documentação atual OpenAI: https://developers.openai.com/plugins/build/plugins e https://learn.chatgpt.com/docs/cli/reference.

## Inventário e riscos por etapa
| Etapa | Evidência upstream | Veredito para CoinBlink |
|---|---|---|
| Marketplace | `.agents/plugins/marketplace.json`, `source: local`, `path: ./`, ECC 2.2.3 | ROOT válido no checkout fixado; não prova plugin instalado |
| Manifesto principal | `.codex-plugin/plugin.json`: `./skills/`, `./.mcp.json`, `./hooks/codex-hooks.json`, assets | Referências internas válidas se o cache copiar a raiz completa; não ativar ainda |
| Manifesto legado | `plugins/ecc/.codex-plugin/plugin.json` usa `../../skills/`, `../../.mcp.json` | **BLOCKED:** atravessa o root do cache de plugin isolado; não empacotar subdiretório legado |
| Discovery | 311 SKILL.md verificadas; manifestos dizem 281/249 | Drift dos textos do manifesto. Discovery real e compatibilidade da CLI NÃO VERIFICADOS |
| Cache | `scripts/codex/check-plugin-cache.js`, `CODEX_HOME/plugins/cache/ecc/ecc/` | Cache do usuário não inspecionado; versão armazenada pode divergir; `codex plugin list` isolado não basta |
| Hooks | `hooks/codex-hooks.json` SessionStart chama Node e bootstraps ECC | **BLOCKED:** pode disparar subprocessos e ler estado externo; requer auditoria e trust explícito separado |
| MCP | `.mcp.json`: `npx -y chrome-devtools-mcp@1.10.1` | **BLOCKED:** pode instalar pacote no runner/host, abrir browser e usar rede |
| Config | `.codex/config.toml` multi_agent e roles | **BLOCKED:** não importar sobre instruções e orquestração do CoinBlink |
| Install shell | `install.sh`: `npm install --ignore-scripts` e `scripts/install-apply.js` | **BLOCKED:** instalações e mudanças de config, mesmo sem postinstall |
| Install Windows | `install.ps1`: também pode chamar `npm install --ignore-scripts` | **BLOCKED:** não rodar |
| Sync legado | `scripts/sync-ecc-to-codex.sh` escreve `~/.codex`, prompts e MCP | **BLOCKED:** não combinar com plugin nativo |
| Git hooks globais | `scripts/codex/install-global-git-hooks.sh` usa `git config --global core.hooksPath` | **BLOCKED:** afetaria outros repositórios e módulos |
| Remoção nativa | CLI oficial: `codex plugin remove ecc@ecc`, e marketplace separado | Apenas procedimento documentado. Nenhum comando executado |
| Remoção legado | `node scripts/ecc.js uninstall --legacy-codex-sync --dry-run` | Separado da desinstalação nativa; exigir ownership manifest e revisão antes de executar |

## Compatibilidade e rollback: procedimentos futuros não executados
1. Antes de eventual instalação: inventariar versão CLI, `CODEX_HOME`, marketplaces, plugins, hooks trust, MCP e credenciais sem abrir secrets.
2. Usar perfil/CODEX_HOME isolado, nunca sobrepor a configuração de desenvolvimento atual. Fixar upstream por commit e verificar cache por hashes.
3. Rejeitar symlink e caminhos com `..`; exigir que root manifest, skills, scripts e assets coexistam dentro do cache copiado.
4. Não confiar hook e não iniciar MCP. Registro no marketplace não é autorização para SessionStart, npx ou instalação.
5. Para usar as quatro skills, exigir sessão autenticada, franquia incluída comprovada sem créditos pagos, FS e rede isolados, somente fixture sintética e autorização por HEAD.
6. Para rollback da instalação nativa, inspecionar e só então remover `ecc@ecc`; remover marketplace de forma independente e preservar outros plugins. Instalação legacy possui rollback diferente.
7. Só incorporar subconjunto aprovado na main após CI no HEAD exato, revisão substantiva e autorização específica. Nunca copiar hooks e MCP automaticamente.

## Testes reproduzíveis (somente leitura de fixtures locais)
`python3 -m unittest discover -s tools/benchmarks/ecc-coinblink/validation -p 'test_native_codex_chain.py' -v`

Verificam PIN SHA/árvore e fingerprints Git, diferenças 311/281/249, raiz versus thin manifesto, negative paths e traversal, hooks/MCP não autorizados, rollback distinto, quatro pares de skills CoinBlink e ausência de instalação.

**Limite:** o teste garante coerência do snapshot estático inspecionado no GitHub, não prova instalação, autenticidade contínua do upstream, cache do usuário, discovery ou execução da CLI. O upstream nunca é baixado pela CI.

## Complemento da auditoria: risco de falsa confirmação do cache

**Falha de escopo comprovada no upstream** [`scripts/codex/check-plugin-cache.js` linhas 143–161](https://github.com/affaan-m/ECC/blob/90606c8315ee09cafc303515c5f33024db6b9882/scripts/codex/check-plugin-cache.js#L143-L161): `collectManifestRefs()` inspeciona **somente** `skills`, `mcpServers`, `interface.composerIcon` e `interface.logo`. O `hooks` do manifesto não está na lista e os scripts Node do bootstrap tampouco são verificados. Além disso, `pathExists()` usa `fs.statSync`, segue links simbólicos e não compara hashes. Por isso, **`check-plugin-cache.js` com exit 0 é insuficiente** para declarar o cache seguro, íntegro ou capaz de executar skills. O CoinBlink exigirá verificação independente de todas as referências e scripts, com `realpath` contido no root, lstat sem links, SHA/versão correspondentes ao upstream fixado e prova real de discovery da CLI somente em piloto autorizado.

## Efeitos colaterais confirmados no SessionStart

A cadeia manifestada é `hooks/codex-hooks.json` → `scripts/hooks/plugin-hook-bootstrap.js` → `scripts/hooks/session-start-bootstrap.js` → `run-with-flags.js` → `scripts/hooks/session-start.js`. A [implementação real](https://github.com/affaan-m/ECC/blob/90606c8315ee09cafc303515c5f33024db6b9882/scripts/hooks/session-start.js#L650-L680) **cria diretórios de sessão e skills aprendidas**, **remove arquivos expirados com `fs.rmSync`** e **grava lease de sessão**; também consulta resumos anteriores e skills aprendidas para contexto. Variáveis de configuração podem desativar injeção de texto, mas não se deve presumir que desativem as escritas. O hook permanece **sem confiança e sem execução** no CoinBlink.

## Inventário reproduzível de discovery

O arquivo `pinned-surface-inventory.json` guarda caminhos exatos dos **311 `SKILL.md`**, **71 agentes** e **97 comandos** extraídos da árvore Git `9172b168b070a802bbc0a7c53a4ca968e761a8c6` completa e imutável; os novos testes validam contagens, unicidade, sintaxe e disjunção das superfícies. **Arquivos no upstream ≠ pacotes copiados ao cache ≠ skills descobertas pelo Codex.** Nenhuma dessas últimas etapas ocorreu neste experimento.

## Rollback e instalação sem efeitos globais

O `sync-ecc-to-codex.sh` não é caminho nativo e pode editar `~/.codex/config.toml`, `AGENTS.md`, prompts, MCP e `core.hooksPath` global. O instalador global de hooks fornece dry-run, mas aplicar pode afetar **todos os repositórios**, inclusive módulos CoinBlink. O uninstall por estado legado possui manifesto de propriedade e não equivale a `codex plugin remove ecc@ecc`; **não executar nenhum**. Reverter plugin, marketplace, perfis e hooks exige inspeção de propriedade e consentimento antes de qualquer ação no host.
