import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("M14 offline incident exercise changes scenarios via keyboard and never sends alerts",async({page})=>{
  const outside=[],writes=[],errors=[];
  page.on("request",r=>{
    if(!r.url().startsWith("http://127.0.0.1:4321/")&&!r.url().startsWith("data:")) outside.push(r.url());
    if(!["GET","HEAD"].includes(r.method())) writes.push(r.url());
  });
  page.on("pageerror",e=>errors.push(e.message));
  const response=await page.goto("/demo/incident-drill");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading",{name:"Local incident response rehearsal"})).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/u);
  const picker=page.locator("[data-m14-scenario]");
  const steps=page.locator("[data-m14-steps] li");
  const status=page.locator("[data-m14-status]");
  await expect(picker).toHaveValue("baseline");
  await expect(steps).toHaveCount(2);
  await expect(status).toContainText("PRACTICE ONLY");
  await picker.selectOption("queue");
  await expect(steps).toHaveCount(3);
  await expect(status).toContainText("SIMULATED WARNING");
  await picker.selectOption("security");
  await expect(steps).toHaveCount(3);
  await expect(status).toContainText("SIMULATED HOLD");
  await expect(page.locator("main")).toContainText("NO ACTIONS EXECUTED");
  const reset=page.getByRole("button",{name:"Reset rehearsal"});
  await reset.focus();
  await page.keyboard.press("Enter");
  await expect(picker).toHaveValue("baseline");
  await expect(picker).toBeFocused();
  await expect(steps).toHaveCount(2);
  for(const width of [320,390,768,1366,1536]){
    await page.setViewportSize({width,height:900});
    const size=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    expect(size.scroll).toBeLessThanOrEqual(size.viewport);
  }
  const scan=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
  await page.reload();
  await expect(picker).toHaveValue("baseline");
  expect(outside).toEqual([]);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test("M14 exercise stays disconnected from privileged real platform operations",async({page})=>{
  await page.goto("/demo/incident-drill");
  const text=await page.locator("main").innerText();
  for(const flag of ["SIMULATION ONLY","NO LIVE MONITORING","NO ACTIONS EXECUTED","NO ALERTS SENT"]){
    expect(text).toContain(flag);
  }
  await expect(page.locator("iframe,img,form,script[src^='https://']")).toHaveCount(0);
  for(const route of ["/admin","/admin/login"]){
    const response=await page.request.get(route);
    expect(response.status()).toBeGreaterThanOrEqual(400);
  }
});
