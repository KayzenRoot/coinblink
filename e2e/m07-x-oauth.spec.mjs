import { test, expect } from "@playwright/test";

test("M07 X OAuth routes exist and fail closed without credentials", async ({ page }) => {
  const foreign = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) {
      foreign.push(request.url());
    }
  });
  const start = await page.goto("/api/oauth/x/start");
  expect(start?.status()).toBe(503);
  await expect(page.locator("body")).toContainText("not configured");
  const callback = await page.goto("/api/oauth/x/callback");
  expect(callback?.status()).toBe(503);
  const body = await page.locator("body").innerText();
  expect(body).toContain("not configured");
  expect(body).not.toContain("access_token");
  expect(foreign).toEqual([]);
});
