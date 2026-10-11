const loopbackHosts = new Set(["127.0.0.1", "::1", "localhost"]);

export function createPreviewEvidenceBrowserContext(browser, options = {}) {
  return browser.newContext({ ...options, serviceWorkers: "block" });
}

export function createPreviewEvidenceRouteHandler({
  allowedOrigins,
  blockedOrigins,
  blockedRedirects,
  routeFetchErrors,
  allowInsecureLoopbackForTest = false,
}) {
  return async (route) => {
    const requestedUrl = new URL(route.request().url());
    const isHttps = requestedUrl.protocol === "https:";
    const isTestLoopback =
      allowInsecureLoopbackForTest &&
      requestedUrl.protocol === "http:" &&
      loopbackHosts.has(requestedUrl.hostname);

    if ((!isHttps && !isTestLoopback) || !allowedOrigins.has(requestedUrl.origin)) {
      blockedOrigins.push(requestedUrl.origin);
      await route.abort();
      return;
    }

    let response;
    try {
      response = await route.fetch({ maxRedirects: 0 });
    } catch (error) {
      routeFetchErrors.push({
        url: requestedUrl.href,
        message: error instanceof Error ? error.message : String(error),
      });
      await route.abort();
      return;
    }

    if (response.status() >= 300 && response.status() < 400) {
      const location = response.headers().location;
      let destination = null;
      if (location) {
        try {
          destination = new URL(location, requestedUrl).href;
        } catch {
          destination = location;
        }
      }
      blockedRedirects.push({ source: requestedUrl.href, destination });
      await response.dispose();
      await route.abort();
      return;
    }

    await route.fulfill({ response });
  };
}
