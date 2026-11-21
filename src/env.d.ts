/// <reference types="astro/client" />

declare module "cloudflare:workers" {
  /** Worker bindings, variables and secrets for the current request. */
  export const env: Record<string, unknown>;
}

declare namespace App {
  interface Locals {
    /** Set in route frontmatter before Astro starts streaming the layout. */
    seoRobotsRequested?: string;
  }
}
