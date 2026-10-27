import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("M16 local watchlist preview never monitors, stores or delivers even with every entry selected",async({page})=>{
  const outbound=[],writes=[],errors=[];
  page.on("request",r=>{
    if(!r.url().startsWith("http://127.0.0.1:4321/")&&!r.url().startsWith("data:"))outbound.push(r.url());
    if(!["GET","HEAD"].includes(r.method()))writes.push(r.url());
  });
  page.on("pageerror",e=>errors.push(e.message));
  const response=await page.goto("/demo/watchlist");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading",{name:"Local watchlist preview"})).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/u);
  const boxes=page.locator("[data-m16-asset]");
  const count=page.locator("[data-m16-progress]");
  const verdict=page.locator("[data-m16-status]");
  const threshold=page.locator("[data-m16-threshold]");
  await expect(boxes).toHaveCount(4);
  await expect(count).toContainText("0 of 4");
  await expect(verdict).toContainText("ALERTS DISABLED");
  for(let index=0;index<4;index++){
    await boxes.nth(index).check();
    await expect(count).toContainText(String(index+1)+" of 4");
    await expect(verdict).toContainText("ALERTS DISABLED");
  }
  await expect(boxes.nth(3)).toBeChecked();
  await threshold.selectOption("above");
  await expect(verdict).toContainText("ALERTS DISABLED");
  await expect(verdict).toContainText("notional direction above");
  await expect(page.getByRole("button",{name:/subscribe|alert me|notify|enable|trade|sign in|log in/i})).toHaveCount(0);
  await expect(page.locator("input[type='email'],form")).toHaveCount(0);
  await boxes.nth(1).uncheck();
  await expect(count).toContainText("3 of 4");
  await expect(verdict).toContainText("ALERTS DISABLED");
  const reset=page.getByRole("button",{name:"Reset practice watchlist"});
  await reset.focus();
  await page.keyboard.press("Enter");
  await expect(count).toContainText("0 of 4");
  for(let i=0;i<4;i++)await expect(boxes.nth(i)).not.toBeChecked();
  await expect(threshold).toHaveValue("none");
  await expect(boxes.first()).toBeFocused();
  for(const width of [320,390,768,1366,1536]){
    await page.setViewportSize({width,height:900});
    const state=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    expect(state.scroll).toBeLessThanOrEqual(state.viewport);
  }
  const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
  await boxes.first().check();
  await page.reload();
  await expect(count).toContainText("0 of 4");
  await expect(verdict).toContainText("ALERTS DISABLED");
  expect(outbound).toEqual([]);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test("M16 preview cannot act as a live personalized alert service",async({page})=>{
  await page.goto("/demo/watchlist");
  const body=await page.locator("main").innerText();
  for(const marker of ["LOCAL SYNTHETIC","NOT ADMITTED","ALERTS DISABLED","NO ACCOUNT","NO LIVE ALERTS"]){
    expect(body).toContain(marker);
  }
  await expect(page.locator("iframe,img,form,script[src^='https://']")).toHaveCount(0);
  for(const url of ["/admin","/admin/login"]){
    const r=await page.request.get(url);
    expect(r.status()).toBeGreaterThanOrEqual(400);
  }
});
