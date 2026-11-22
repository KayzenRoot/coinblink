import { resolveSiteOrigin } from './site-locales.mjs';

export const NOINDEX_DIRECTIVE = 'noindex, nofollow, noarchive';
export const INDEX_DIRECTIVE = 'index, follow';

/** Require a conscious runtime opt-in on the exact configured production origin. */
export function publicIndexingEnabled({ environment, enabled, origin, requestOrigin } = {}) {
  if (environment !== 'production' || enabled !== 'true' || origin !== requestOrigin) return false;
  try {
    return resolveSiteOrigin(origin) !== null;
  } catch {
    return false;
  }
}

/** Only editorial landing pages and published article URLs may be discovered. */
export function isIndexablePath(pathname) {
  return typeof pathname === 'string'
    && /^\/(?:en|pt-br|es)\/(?:editorial|article\/[a-z0-9]+(?:-+[a-z0-9]+)*)$/u.test(pathname);
}

/** An indexing request is advisory until the deployment and route both qualify. */
export function resolveRobotsDirective({ pathname, requested, status, ...config } = {}) {
  return status === 200
    && requested === INDEX_DIRECTIVE
    && publicIndexingEnabled(config)
    && isIndexablePath(pathname)
    ? INDEX_DIRECTIVE : NOINDEX_DIRECTIVE;
}

export function buildRobotsText(config = {}) {
  if (!publicIndexingEnabled(config)) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\nSitemap: ${config.origin}/sitemap.xml\n`;
}
