// CB-M11-P1-OPENAPI-001: public OpenAPI 3.1 contract for the metadata API.
import type { APIRoute } from "astro";
import { buildOpenApiDocument } from "../../modules/CB-M11/openapi.mjs";
import { publicJsonEndpoint, publicJsonHeaders } from "../../modules/CB-M11/public-json-endpoint.mjs";

export const prerender = false;

const HEADERS = publicJsonHeaders("public, max-age=3600, s-maxage=60");

const handlers = publicJsonEndpoint({
  headers: HEADERS,
  buildBody: () => JSON.stringify(buildOpenApiDocument()),
});

export const GET: APIRoute = handlers.GET;
export const OPTIONS: APIRoute = handlers.OPTIONS;
export const ALL: APIRoute = handlers.ALL;
