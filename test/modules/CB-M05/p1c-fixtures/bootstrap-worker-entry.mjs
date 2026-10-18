// LOCAL TEST FIXTURE ONLY. Bundled by the test harness and hosted in Miniflare/workerd for the
// 100-way first-Owner race, so concurrent D1 batches run inside the Worker runtime instead of
// crossing the Node-to-Miniflare D1 proxy. The handler is unchanged. Never deployed or routed.
import { CMS_TEST_ORIGIN, createLocalCmsHandler } from '../../../../src/modules/CB-M05/p1c-local/local-cms.mjs';

const RAW = Symbol('raw');
const DIAGNOSTIC_PATH = '/__test/diagnostics';
const diagnostics = [];

// Redacted: records only the statement verb/table labels, method, error name and transport code.
// Bound parameters, messages, cookies, tickets and key material are never recorded.
function recordFailure(stage, method, error) {
  const message = String(error?.message ?? '');
  const kind = /UNIQUE constraint failed|CHECK constraint failed|FOREIGN KEY constraint failed/i.test(message)
    ? 'constraint'
    : (error?.cause || /ECONNRESET|fetch failed/i.test(message) ? 'transport' : 'other');
  diagnostics.push({ stage, method, kind, name: String(error?.name ?? 'Error'), causeCode: String(error?.cause?.code ?? '') });
}

function instrument(db) {
  const wrapStatement = (statement, stage) => new Proxy(statement, {
    get(target, property) {
      if (property === RAW) return target;
      if (property === 'bind') return (...values) => wrapStatement(target.bind(...values), stage);
      if (property === 'first' || property === 'run' || property === 'all' || property === 'raw') {
        return async (...args) => {
          try {
            return await target[property](...args);
          } catch (error) {
            recordFailure(stage, property, error);
            throw error;
          }
        };
      }
      const value = target[property];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return new Proxy(db, {
    get(target, property) {
      if (property === 'prepare') {
        return sql => wrapStatement(target.prepare(sql), sql.trim().split(/\s+/).slice(0, 3).join(' '));
      }
      if (property === 'batch') {
        return async statements => {
          try {
            return await target.batch(statements.map(statement => statement[RAW] ?? statement));
          } catch (error) {
            recordFailure('BATCH', 'batch', error);
            throw error;
          }
        };
      }
      const value = target[property];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

const handler = createLocalCmsHandler();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (env?.CB_M05_LOCAL_TEST_ONLY === 'true' && request.method === 'GET' &&
        url.origin === CMS_TEST_ORIGIN && url.pathname === DIAGNOSTIC_PATH) {
      return Response.json({ entries: diagnostics.splice(0) }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return handler(request, { ...env, CMS_D1_LOCAL: env?.CMS_D1_LOCAL ? instrument(env.CMS_D1_LOCAL) : undefined });
  },
};
