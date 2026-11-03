import { test, expect } from "@playwright/test";

// The Instagram and TikTok apps do not exist yet on this deployment. Both flows
// must answer a closed 503 instead of a 404 or an external redirect, so the
// redirect URIs the owner registers later already resolve.
test("M07 Instagram and TikTok OAuth routes exist and fail closed", async ({ page }) => {
  const foreign = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
      foreign.push(request.url());
    }
  });
  for (const network of ["instagram", "tiktok"]) {
    const start = await page.goto("/api/oauth/" + network + "/start");
    expect(start?.status()).toBe(503);
    expect(await page.locator("body").innerText()).toContain("not configured");
    const callback = await page.goto("/api/oauth/" + network + "/callback");
    expect(callback?.status()).toBe(503);
    const body = await page.locator("body").innerText();
    expect(body).toContain("not configured");
    expect(body).not.toContain("access_token");
  }
  expect(foreign).toEqual([]);
});
