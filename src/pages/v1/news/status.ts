// CB-M11-P1-NEWS-STATUS-001: public, content-free collection status.
import type { APIRoute } from "astro";
import { readLiveNews } from "../../../modules/CB-M03/live-news.mjs";
import { buildNewsStatus } from "../../../modules/CB-M03/news-status.mjs";
import { LIVE_NEWS_WINDOW_SECONDS } from "../../../modules/CB-M03/rss-sources.mjs";
import { publicJsonEndpoint, publicJsonHeaders } from "../../../modules/CB-M11/public-json-endpoint.mjs";

export const prerender = false;

const HEADERS = publicJsonHeaders("public, max-age=60");

const handlers = publicJsonEndpoint({
  headers: HEADERS,
  buildBody: async () => JSON.stringify(buildNewsStatus(
    await readLiveNews({ enabled: import.meta.env.PUBLIC_NEWS_LIVE }),
    { windowSeconds: LIVE_NEWS_WINDOW_SECONDS },
  )),
});

export const GET: APIRoute = handlers.GET;
export const OPTIONS: APIRoute = handlers.OPTIONS;
export const ALL: APIRoute = handlers.ALL;
