const routes = [
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
].flatMap(([network, provider]) => [
  { path: `/api/oauth/${network}/start`, provider, callback: false },
  { path: `/api/oauth/${network}/callback`, provider, callback: true },
]);

function isExpectedRefusal({ status, headers }, body, { provider, callback }, local) {
  if (status === 503) {
    return body.includes(`<h1>${provider} OAuth is not configured</h1>`)
      || (!local && callback && body.includes("<h1>Owner storage is not configured</h1>"));
  }
  if (local) return false;
  if (callback) return status === 400 && body.includes("<h1>Invalid callback</h1>");
  return status === 404 && body === "Not found"
    && /^text\/plain(?:;|$)/iu.test(headers.get("content-type") ?? "");
}

/** Check route reachability locally and the anonymous security boundary after deploy. */
export async function verifySocialOAuthSmoke(base, { local = false, fetchImpl = fetch } = {}) {
  await Promise.all(routes.map(async (route) => {
    const response = await fetchImpl(new URL(route.path, base), {
      redirect: "manual",
      credentials: "omit",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const { headers, status } = response;
    const body = await response.text();
    // A malformed callback can expire an old state cookie. Anonymous starts
    // must never issue a cookie or redirect to the authorization provider.
    if (headers.has("location") || (!route.callback && headers.has("set-cookie"))
      || headers.get("cache-control") !== "no-store"
      || !isExpectedRefusal(response, body, route, local)) {
      throw new Error(`OAuth smoke failed for ${route.path}: unexpected HTTP ${status}`);
    }
  }));
}
