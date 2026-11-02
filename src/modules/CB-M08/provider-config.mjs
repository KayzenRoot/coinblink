// CB-M08-P1-PROVIDER-001: read the configured writer from the encrypted settings.
//
// Settings win over the Worker env (getSetting already falls back to it), so the
// owner can switch providers from the panel without a deploy. Without a key the
// caller keeps using Workers AI.

import { getSetting } from '../CB-M05/p1-production/settings.mjs';

export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-v4.1-flash';

/** @param {{db: any, secret: string, env?: object}} options */
export async function aiProviderFromSettings({ db, secret, env = {} }) {
  const read = async (key) => {
    const value = await getSetting({ db, secret, env, key });
    return typeof value === 'string' ? value.trim() : '';
  };
  const name = (await read('M08_PROVIDER')) || 'workers-ai';
  if (name !== 'deepseek') return Object.freeze({ name: 'workers-ai' });
  // M08_MODEL is shared with Workers AI, so a @cf/ value is never used as the
  // external model id; the DeepSeek default applies instead.
  const configured = await read('M08_MODEL');
  const model = configured !== '' && !configured.startsWith('@cf/') ? configured : DEFAULT_DEEPSEEK_MODEL;
  return Object.freeze({
    name: 'deepseek',
    baseUrl: await read('DEEPSEEK_BASE_URL'),
    apiKey: await read('DEEPSEEK_API_KEY'),
    model,
  });
}
