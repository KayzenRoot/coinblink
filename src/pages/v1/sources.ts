// CB-M11-P1-SOURCE-CATALOG-001: public publisher metadata endpoint.
import type { APIRoute } from "astro";
import { buildSourceCatalog } from "../../modules/CB-M03/source-catalog.mjs";
import { publicJsonEndpoint, publicJsonHeaders } from "../../modules/CB-M11/public-json-endpoint.mjs";

export const prerender = false;

const HEADERS = publicJsonHeaders("public, max-age=3600, s-maxage=60");

const handlers = publicJsonEndpoint({
  headers: HEADERS,
  buildBody: () => JSON.stringify(buildSourceCatalog()),
});

export const GET: APIRoute = handlers.GET;
export const OPTIONS: APIRoute = handlers.OPTIONS;
export const ALL: APIRoute = handlers.ALL;
