export function isFixtureOriginRequest(requestUrl, fixtureOrigin) {
  try {
    return new URL(requestUrl).origin === new URL(fixtureOrigin).origin;
  } catch {
    return false;
  }
}