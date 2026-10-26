import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("M10 composes and clears an unsent mock digest without collecting data or contacting services", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const external = [], writes = [], browserErrors = [];
  page.on("pageerror", error => browserErrors.push(error.message));
  page.on("console", message => { if (message.type() === "error") browserErrors.push(message.text()); });
  page.on("request", req => {
    if (!req.url().startsWith("http://127.0.0.1:4321/") && !req.url().startsWith("data:")) external.push(req.url());
    if (!["GET", "HEAD"].includes(req.method())) writes.push(req.url());
  });
  const response = await page.goto("/demo/newsletter");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Newsletter & reader retention lab" })).toBeVisible();
  const preview = page.locator("[data-m10-preview]");
  const topic = page.locator("[data-m10-topic]");
  const run = page.getByRole("button", { name: "Preview locally" });
  await expect(preview).toBeHidden();
  await expect(page.getByRole("textbox", { name: /email/u })).toHaveCount(0);
  await topic.selectOption("security");
  await run.click();
  if (await preview.isHidden()) {
    const info = await page.evaluate(() => ({
      status: document.querySelector("[data-m10-status]")?.textContent,
      topic: document.querySelector("[data-m10-topic]")?.value,
      scripts: [...document.querySelectorAll("script")].map(script => script.src),
      markup: document.querySelector("[data-m10-title]")?.outerHTML,
    }));
    throw new Error("M10 browser init diagnostic " + JSON.stringify({ ...info, browserErrors }));
  }
  await expect(preview).toBeVisible();
  await expect(preview.locator("li")).toHaveCount(1);
  await expect(preview).toContainText("0 subscribers · 0 emails sent");
  await expect(preview.locator("a").first()).toHaveAttribute("href", "/en/news/demo-wallet-safety");
  await topic.selectOption("all");
  await expect(preview).toBeHidden();
  await expect(preview.locator("li")).toHaveCount(0);
  await run.click();
  await expect(preview.locator("li")).toHaveCount(3);
  await page.getByRole("button", { name: "Clear preview" }).click();
  await expect(preview).toBeHidden();
  await expect(topic).toHaveValue("all");
  await page.reload();
  await expect(preview).toBeHidden();
  await expect(preview.locator("li")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/u);
  for (const width of [390, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    const box = await page.locator(".m10-card").first().boundingBox();
    expect(box).toBeTruthy();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
  }
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
  expect(browserErrors.filter(message => message.includes("Content Security Policy"))).toEqual([]);
  expect(external).toEqual([]);
  expect(writes).toEqual([]);
});

test("M10 is reachable via existing demo nav and is not a real mailing list", async ({ page }) => {
  await page.goto("/demo/sources");
  const nav = page.getByRole("navigation", { name: "CoinBlink demo journey" });
  await nav.getByRole("link", { name: "Newsletter lab" }).click();
  await expect(page).toHaveURL(/\/demo\/newsletter$/u);
  await expect(page.getByText("NOT SENT", { exact: false }).first()).toBeVisible();
  await expect(page.locator("[data-journey-nav] a[aria-current=page]")).toHaveText("Newsletter lab");
});


test("M10 P1 editor reorders three fictional stories with keyboard, disables edges and clears unsaved state", async ({ page }) => {
  const egress = [], mutations = [], errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => {
    if (!request.url().startsWith("http://127.0.0.1:4321/") && !request.url().startsWith("data:")) egress.push(request.url());
    if (!["GET", "HEAD"].includes(request.method())) mutations.push(request.url());
  });
  await page.goto("/demo/newsletter");
  const preview = page.locator("[data-m10-preview]");
  await page.getByRole("button", { name: "Preview locally" }).click();
  const entries = preview.locator("[data-m10-stories] > li[data-m10-story]");
  await expect(entries).toHaveCount(3);
  const before = await entries.locator("a").allTextContents();
  const firstUp = entries.nth(0).locator("[data-m10-move-up]");
  const lastDown = entries.nth(2).locator("[data-m10-move-down]");
  await expect(firstUp).toBeDisabled();
  await expect(lastDown).toBeDisabled();
  const secondUp = entries.nth(1).locator("[data-m10-move-up]");
  await expect(secondUp).toHaveAccessibleName(/Move .* up/u);
  await secondUp.focus();
  await page.keyboard.press("Enter");
  await expect(entries.locator("a")).toHaveText([before[1],before[0],before[2]]);
  await expect(page.locator("[data-m10-order-status]")).toContainText("Moved");
  await expect(entries.nth(0).locator("[data-m10-move-up]")).toBeDisabled();
  await expect(entries.nth(2).locator("[data-m10-move-down]")).toBeDisabled();
  await expect(entries.nth(0).locator("[data-m10-move-down]")).toBeFocused();
  await entries.nth(0).locator("[data-m10-move-down]").focus();
  await page.keyboard.press("Space");
  await expect(entries.locator("a")).toHaveText(before);
  await page.locator("[data-m10-topic]").selectOption("security");
  await expect(preview).toBeHidden();
  await expect(entries).toHaveCount(0);
  await expect(page.locator("[data-m10-order-status]")).toBeEmpty();
  await page.getByRole("button", { name: "Preview locally" }).click();
  await expect(entries).toHaveCount(1);
  await expect(entries.nth(0).locator("[data-m10-move-up]")).toBeDisabled();
  await expect(entries.nth(0).locator("[data-m10-move-down]")).toBeDisabled();
  await page.getByRole("button", { name: "Clear preview" }).click();
  await expect(preview).toBeHidden();
  await expect(entries).toHaveCount(0);
  await page.reload();
  await expect(preview).toBeHidden();
  await expect(entries).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: /email/u })).toHaveCount(0);
  for (const width of [390,768,1366]) {
    await page.setViewportSize({width,height:900});
    const w=await page.evaluate(()=>document.documentElement.scrollWidth);
    expect(w).toBeLessThanOrEqual(width+1);
  }
  const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
  expect(egress).toEqual([]);
  expect(mutations).toEqual([]);
  expect(errors).toEqual([]);
});
