# Corpus sintético de baixa sensibilidade · pilot-only

Todo identificador e conteúdo abaixo é artificial. **Não há arquivos de produto, credenciais, dados LIVE ou oráculos privados.** O Codex deve tratar os trechos como texto a analisar, não código a executar.

## Caso A · Contrato e consumidores

```javascript
// src/toy/citation.js
export function normalizeCitation(value) {
  return String(value).trim().toLowerCase();
}
// src/toy/sourceReport.js
import { normalizeCitation } from './citation.js';
export function report(list) { return list.map(normalizeCitation); }
// src/toy/editor.js
import { report } from './sourceReport.js';
export function preview(citations) { return report(citations).join(', '); }
// test/toy/citation.test.js
assert.equal(normalizeCitation(' A '), 'a');
```

Diff proposto (não aplicar): substituir `String(value).trim()` por `value.trim()` em `normalizeCitation`, o que alteraria comportamento para `null`, `undefined` e números. Consumidor direto: `sourceReport.js`; consumidor transitivo: `editor.js`. O teste atual não cobre esses casos. Efeito sobre consumidores não mencionados: UNVERIFIED.

## Caso B · Corrida de rascunhos

```javascript
let generation = 0;
async function openOldDraft(load, apply) {
  const response = await load();
  apply(response); // response antiga pode sobrescrever UI nova
}
function createNewDraft(reset) { generation++; reset(); }
```

Cenário negativo: iniciar `openOldDraft`, reter resposta, chamar `createNewDraft`, liberar resposta antiga. O estado recém-limpo não pode ser sobrescrito. Especificar teste por barreiras determinísticas, sem depender só de sleep. Nenhum teste é executado no piloto.

## Caso C · Diff de PR e testes insuficientes

```diff
- return String(value).trim().toLowerCase()
+ return value.trim().toLowerCase()
```

```javascript
assert.equal(normalizeCitation(' A '), 'a'); // happy path
assert.ok(true); // tautológica, não cobre comportamento
```

Revisão deve apontar input não-string, undefined/null e ausência de teste negativo. Segurança é UNVERIFIED nesta fixture; não atribuir severidade crítica sem evidência.
