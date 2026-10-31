// CB-M14-P1-COST-REPORT-001: provider cost inputs for the owner.
//
// The Cloudflare token stays in the operator environment, never in the Worker:
// this module runs from a script or CI. It reads only aggregate counters —
// Worker requests, Worker errors and D1 rows read/written — which are the
// measured drivers of the platform bill.

export const GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

/** Normalizes the GraphQL envelope into plain numbers; throws on API errors. */
export function summarizeCosts(payload) {
  if (payload === null || typeof payload !== 'object') throw new TypeError('a GraphQL payload is required');
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw new Error('Cloudflare GraphQL error: ' + String(payload.errors[0]?.message ?? 'unknown'));
  }
  const account = payload.data?.viewer?.accounts?.[0] ?? {};
  const workers = account.workersInvocationsAdaptive ?? [];
  const databases = account.d1AnalyticsAdaptiveGroups ?? [];
  const models = account.aiInferenceAdaptiveGroups ?? [];
  const sum = (rows, key) => rows.reduce((total, row) => total + Number(row?.sum?.[key] ?? 0), 0);
  return Object.freeze({
    workers: Object.freeze({
      requests: sum(workers, 'requests'),
      errors: sum(workers, 'errors'),
      scripts: Object.freeze(workers.map((row) => Object.freeze({
        script: row?.dimensions?.scriptName ?? 'unknown',
        requests: Number(row?.sum?.requests ?? 0),
        errors: Number(row?.sum?.errors ?? 0),
      }))),
    }),
    d1: Object.freeze({
      rowsRead: sum(databases, 'rowsRead'),
      rowsWritten: sum(databases, 'rowsWritten'),
    }),
    ai: Object.freeze({
      neurons: Math.round(sum(models, 'totalNeurons') * 1000) / 1000,
      models: Object.freeze(models.map((row) => Object.freeze({
        model: row?.dimensions?.modelId ?? 'unknown',
        neurons: Math.round(Number(row?.sum?.totalNeurons ?? 0) * 1000) / 1000,
      }))),
    }),
  });
}

export function costQuery({ accountId, from, to, scriptName, databaseId }) {
  if (typeof accountId !== 'string' || !/^[0-9a-f]{32}$/u.test(accountId)) throw new TypeError('accountId is required');
  for (const value of [from, to]) {
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new TypeError('from and to must be ISO dates');
  }
  const range = 'datetime_geq: "' + from + '", datetime_leq: "' + to + '"';
  const script = typeof scriptName === 'string' && scriptName !== ''
    ? ', scriptName: "' + scriptName.replaceAll('"', '') + '"'
    : '';
  const database = typeof databaseId === 'string' && databaseId !== ''
    ? ', databaseId: "' + databaseId.replaceAll('"', '') + '"'
    : '';
  return 'query { viewer { accounts(filter: {accountTag: "' + accountId + '"}) { '
    + 'workersInvocationsAdaptive(limit: 50, filter: {' + range + script + '}) '
    + '{ sum { requests errors } dimensions { scriptName } } '
    + 'd1AnalyticsAdaptiveGroups(limit: 50, filter: {' + range + database + '}) '
    + '{ sum { rowsRead rowsWritten } dimensions { databaseId } } '
    + 'aiInferenceAdaptiveGroups(limit: 50, filter: {' + range + '}) '
    + '{ sum { totalNeurons } dimensions { modelId } } } } }';
}

export async function readProviderCosts({
  fetchImpl = globalThis.fetch, token, accountId, from, to, scriptName, databaseId,
}) {
  if (typeof token !== 'string' || token.length < 20) throw new TypeError('token is required');
  const response = await fetchImpl(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ query: costQuery({ accountId, from, to, scriptName, databaseId }) }),
  });
  if (!response.ok) throw new Error('Cloudflare GraphQL HTTP ' + response.status);
  return summarizeCosts(await response.json());
}

/** Last N whole days as an ISO window, ending now. */
export function windowDays(nowMs, days = 7) {
  const to = new Date(nowMs).toISOString();
  const from = new Date(nowMs - days * 86_400_000).toISOString();
  return Object.freeze({ from, to });
}

export function formatReport(costs, range) {
  const lines = [
    'CoinBlink provider cost inputs',
    'window: ' + range.from + ' → ' + range.to,
    '',
    'Workers requests: ' + costs.workers.requests,
    'Workers errors:   ' + costs.workers.errors,
    'D1 rows read:     ' + costs.d1.rowsRead,
    'D1 rows written:  ' + costs.d1.rowsWritten,
    'Workers AI neurons: ' + costs.ai.neurons,
  ];
  for (const script of costs.workers.scripts) {
    lines.push('  script ' + script.script + ': ' + script.requests + ' requests, ' + script.errors + ' errors');
  }
  for (const model of costs.ai.models) {
    lines.push('  model ' + model.model + ': ' + model.neurons + ' neurons');
  }
  return lines.join('\n');
}
