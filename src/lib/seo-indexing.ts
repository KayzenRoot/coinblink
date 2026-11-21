import { runtimeEnv } from './runtime-env';

/** The private runtime opt-in cannot be activated by a public build flag alone. */
export function seoIndexingConfig(request: Request) {
  return {
    environment: import.meta.env.PUBLIC_BUILD_ENV === 'production'
      ? runtimeEnv('COINBLINK_SEO_ENVIRONMENT') : 'development',
    enabled: runtimeEnv('COINBLINK_SEO_INDEXING_ENABLED'),
    origin: import.meta.env.PUBLIC_SITE_ORIGIN,
    requestOrigin: new URL(request.url).origin,
  };
}
