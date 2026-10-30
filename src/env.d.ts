/// <reference types="astro/client" />

declare module "cloudflare:workers" {
  /** Worker bindings, variables and secrets for the current request. */
  export const env: Record<string, unknown>;
}
