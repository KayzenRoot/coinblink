import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("M12 fictitious quota simulator is keyboard accessible, bounded and never contacts providers", async ({ page }) => {
  const external = [], writes = [], errors = [];
  page.on("request", r => {
    if (!r.url().startsWith("http://127.0.0.1:4321/") && !r.url().startsWith("data:")) external.push(r.url());
    if (!["GET","HEAD"].includes(r.method())) writes.push(r.url());
  });
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => {if(m.type()==="error") errors.push(m.text());});
  const response = await page.goto("/demo/api-usage");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Local API usage simulator" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/u);
  const plans=page.locator("[data-m12-preset]");
  const used=page.locator("[data-m12-used]");
  const rest=page.locator("[data-m12-remaining]");
  const status=page.locator("[data-m12-status]");
  await expect(plans).toHaveValue("sample");
  await expect(rest).toHaveText("5");
  await expect(status).toContainText("SIMULATION ONLY");
  await used.focus();
  await used.fill("6");
  await expect(rest).toHaveText("0");
  await expect(status).toContainText("Illustrative limit reached");
  await plans.selectOption("prototype");
  await expect(rest).toHaveText("4");
  await plans.selectOption("lab");
  await expect(rest).toHaveText("14");
  await used.fill("19");
  await expect(rest).toHaveText("1");
  await used.fill("20");
  await expect(rest).toHaveText("0");
  await page.getByRole("button", { name: "Reset simulation" }).focus();
  await page.keyboard.press("Enter");
  await expect(plans).toHaveValue("sample");
  await expect(used).toHaveValue("0");
  await expect(rest).toHaveText("5");
  await expect(plans).toBeFocused();
  await expect(page.getByRole("textbox", { name:/email|card|account/i })).toHaveCount(0);
  for (const width of [320,390,768,1366]) {
    await page.setViewportSize({width,height:900});
    const size=await page.evaluate(()=>({
      screen:document.documentElement.clientWidth,
      page:document.documentElement.scrollWidth,
    }));
    expect(size.page).toBeLessThanOrEqual(size.screen);
  }
  const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
  await page.reload();
  await expect(rest).toHaveText("5");
  expect(external).toEqual([]);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test("M12 quota preview never grants access, payment rights or real market coverage", async ({ page }) => {
  await page.goto("/demo/api-usage");
  const text=await page.locator("main").innerText();
  expect(text).toMatch(/NO BILLING/iu);
  expect(text).toMatch(/NO PAYMENTS/iu);
  expect(text).toMatch(/NO REAL ACCOUNTS/iu);
  expect(text).toMatch(/ILLUSTRATIVE/iu);
  expect(text).not.toMatch(/\$\s*[0-9]|R\$\s*[0-9]/u);
  for (const url of ["/admin", "/admin/login"]) {
    const response=await page.request.get(url);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  }
});
