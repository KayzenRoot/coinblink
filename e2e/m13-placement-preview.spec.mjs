import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("M13 fictitious empty layout previews switch via keyboard without ads or network writes", async ({page}) => {
  const foreign=[], writes=[], errors=[];
  page.on("request",r=>{
    if(!r.url().startsWith("http://127.0.0.1:4321/")&&!r.url().startsWith("data:")) foreign.push(r.url());
    if(!["GET","HEAD"].includes(r.method())) writes.push(r.url());
  });
  page.on("pageerror",e=>errors.push(e.message));
  const response=await page.goto("/demo/placements");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading",{name:"Local ad placement layout lab"})).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/u);
  const selection=page.locator("[data-m13-context]");
  const cards=page.locator("[data-m13-card]");
  const status=page.locator("[data-m13-status]");
  await expect(selection).toHaveValue("home");
  await expect(cards).toHaveCount(2);
  await expect(status).toContainText("2 empty");
  await expect(page.locator("[data-m13-card-list] a")).toHaveCount(0);
  await expect(page.locator("[data-m13-card-list] img")).toHaveCount(0);
  await selection.selectOption("article");
  await expect(cards).toHaveCount(3);
  await expect(status).toContainText("3 empty");
  await selection.selectOption("digest");
  await expect(cards).toHaveCount(1);
  await expect(status).toContainText("1 empty");
  await expect(cards.first()).toContainText("EMPTY PLACEHOLDER");
  const reset=page.getByRole("button",{name:"Reset layout"});
  await reset.focus();
  await page.keyboard.press("Enter");
  await expect(selection).toHaveValue("home");
  await expect(cards).toHaveCount(2);
  await expect(selection).toBeFocused();
  for(const width of [320,390,768,1366,1536]){
    await page.setViewportSize({width,height:900});
    const m=await page.evaluate(()=>({screen:document.documentElement.clientWidth,full:document.documentElement.scrollWidth}));
    expect(m.full).toBeLessThanOrEqual(m.screen);
  }
  const scan=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
  await page.reload();
  await expect(selection).toHaveValue("home");
  await expect(cards).toHaveCount(2);
  expect(foreign).toEqual([]);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test("M13 local ad slots have no sponsors, billing, tracking or production admin authority", async ({page}) => {
  await page.goto("/demo/placements");
  const content=await page.locator("main").innerText();
  for(const required of ["NO LIVE ADS","NO REVENUE","NO SPONSORS","ILLUSTRATIVE"]){
    expect(content).toContain(required);
  }
  expect(content).not.toMatch(/R\$\s*[0-9]|\$\s*[0-9]/u);
  await expect(page.locator("iframe,script[src^='https://'],img")).toHaveCount(0);
  for(const route of ["/admin","/admin/login"]){
    const r=await page.request.get(route);
    expect(r.status()).toBeGreaterThanOrEqual(400);
  }
});
