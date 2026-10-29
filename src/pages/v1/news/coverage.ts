// CB-M11-P1-COVERAGE-STATUS-001: public, content-free coverage counts.
import type { APIRoute } from "astro";
import { readLiveNews } from "../../../modules/CB-M03/live-news.mjs";
import { buildCoverageStatus } from "../../../modules/CB-M03/coverage-status.mjs";
import { publicJsonEndpoint, publicJsonHeaders } from "../../../modules/CB-M11/public-json-endpoint.mjs";

export const prerender = false;

const HEADERS = publicJsonHeaders("public, max-age=60");

const handlers = publicJsonEndpoint({
  headers: HEADERS,
  buildBody: async () => JSON.stringify(buildCoverageStatus(
    await readLiveNews({ enabled: import.meta.env.PUBLIC_NEWS_LIVE }),
  )),
});

export const GET: APIRoute = handlers.GET;
export const OPTIONS: APIRoute = handlers.OPTIONS;
export const ALL: APIRoute = handlers.ALL;
