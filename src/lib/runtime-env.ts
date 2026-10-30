// Astro v6+ exposes Worker bindings through the official module, not locals.
import { env } from "cloudflare:workers";

/** Read a Worker variable or secret without inlining it at build time. */
export function runtimeEnv(key: string): string | undefined {
  const value = (env as Record<string, unknown> | undefined)?.[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** Read a non-string Worker binding (D1, KV, etc.) from the runtime environment. */
export function runtimeBinding(key: string): unknown {
  return (env as Record<string, unknown> | undefined)?.[key];
}
