---
name: ecc-pr-test-analyzer
description: Faça uma revisão read-only de qualidade comportamental dos testes da PR CoinBlink, localizando lacunas e falso-positivos sem substituir os gates reais.
---
# ECC experimental · PR Test Analyzer

Critérios adaptados de agents/pr-test-analyzer.md em affaan-m/ECC@90606c8315ee09cafc303515c5f33024db6b9882, licença MIT. NÃO é o agente original Claude/Sonnet; não requer runtime Claude nem impõe multiagentes.

## Quando ativar
Antes de declarar uma PR READY ou quando regressões complexas, testes novos ou segurança apresentam risco de aprovação superficial.

## Protocolo read-only
1. Confirme número da PR, HEAD/base exatos, escopo e arquivos do diff. Não confunda resultado de commit anterior com HEAD atual.
2. Separe mudança de comportamento, refatoração sem mudança de contrato, documentos e infraestrutura.
3. Para cada comportamento, leia o teste real. Procure assertions triviais, mocks que ocultam erro, cobertura insuficiente de autorização, dados inválidos, corridas, cancelamento, i18n e acessibilidade.
4. Classifique achados CRITICAL/HIGH/MEDIUM/LOW com caminho, localização, reprodução possível e risco real; não infira severidade apenas do nome de uma ferramenta.
5. Revalide Build, SonarCloud, Socket, CI Quality e required checks efetivamente configurados. CodeQL só conta se apareceu e executou. Threads/revisões formais devem ser verificadas separadamente.
6. Pare em BLOCKED se um gate obrigatório falhar ou faltarem evidências essenciais. Não transforme revisão de IA em APPROVED humano.

## Saída esperada
Findings ordenados por gravidade e evidência; matriz de comportamento vs testes; lista de checks por HEAD; status READY/BLOCKED/INCONCLUSIVE com motivos explícitos.

## Limites
O agente não edita arquivos, comenta na PR, faz merge, marca READY ou executa suites sem autorização separada. Sem hooks, MCPs, segredos, bypass, dados reais ou custos.
