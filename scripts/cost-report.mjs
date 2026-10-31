// CB-M14-P1-COST-REPORT-001: print the provider cost inputs for the owner.
//
// Usage: node scripts/cost-report.mjs [--days 7] [--json]
// Reads CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID from the environment.
// The token never reaches the Worker; this runs from an operator machine or CI.
import {
  formatReport, readProviderCosts, windowDays,
} from '../src/modules/CB-M14/cost.mjs';

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}

const days = Number(arg('--days', '7'));
if (!Number.isSafeInteger(days) || days < 1 || days > 30) {
  console.error('--days must be an integer between 1 and 30');
  process.exit(2);
}
const token = process.env.CLOUDFLARE_API_TOKEN ?? '';
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? '';
if (token === '' || accountId === '') {
  console.error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required');
  process.exit(2);
}

const range = windowDays(Date.now(), days);
try {
  const costs = await readProviderCosts({
    token,
    accountId,
    from: range.from,
    to: range.to,
    scriptName: process.env.COINBLINK_CF_WORKER_NAME ?? 'coinblink-production',
  });
  if (process.argv.includes('--json')) console.log(JSON.stringify({ window: range, ...costs }, null, 2));
  else console.log(formatReport(costs, range));
} catch (error) {
  console.error('cost report failed: ' + error.message);
  process.exit(1);
}
