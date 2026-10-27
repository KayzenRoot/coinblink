import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const NARROW=[320,390,768,1366,1536];

function telemetry(page){
  const seen={remote:[],writes:[],crashes:[]};
  page.on("request",(request)=>{
    const url=request.url();
    const local=url.startsWith("http://127.0.0.1:4321/")||url.startsWith("data:");
    if(!local)seen.remote.push(url);
    if(request.method()!=="GET"&&request.method()!=="HEAD")seen.writes.push(url);
  });
  page.on("pageerror",(error)=>{seen.crashes.push(error.message);});
  return seen;
}

async function overflowAt(page,width){
  await page.setViewportSize({width,height:900});
  const measured=await page.evaluate(()=>({
    visible:document.documentElement.clientWidth,
    content:document.documentElement.scrollWidth,
  }));
  expect(measured.content,`overflow at ${width}px`).toBeLessThanOrEqual(measured.visible);
}

test("M17 storyboard composer plans fiction and produces no media",async({page})=>{
  const seen=telemetry(page);
  expect((await page.goto("/demo/storyboard"))?.status()).toBe(200);
  await expect(page.getByRole("heading",{name:"Local storyboard composer"})).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/u);

  const result=page.locator("[data-m17-result]");
  const rows=page.locator("[data-m17-shots] > li");
  await expect(rows).toHaveCount(0);
  await expect(result).toContainText("NOTHING PRODUCED");

  await page.locator("[data-m17-plan]").click();
  await expect(result).toContainText("REFUSED");

  await page.locator("[data-m17-title]").fill("A fictional explainer about custody layers");
  const shots=[
    ["cover","Illustrative cover for an invented custody explainer"],
    ["timeline","Fictional timeline of how a custody plan could unfold"],
  ];
  for(const [kind,caption] of shots){
    await page.locator("[data-m17-kind]").selectOption(kind);
    await page.locator("[data-m17-caption]").fill(caption);
    await page.locator("[data-m17-add]").click();
  }
  await expect(rows).toHaveCount(2);
  await expect(result).toContainText("NOTHING PRODUCED");
  await page.locator("[data-m17-plan]").click();
  await expect(result).toContainText("PLAN ONLY");
  await expect(result).toContainText("2 fictional shot(s) at 16:9");
  await expect(result).toContainText("mediaProduced=false");
  await expect(result).toContainText("cost 0 USD");

  await page.locator('[data-m17-drop="0"]').click();
  await expect(rows).toHaveCount(1);

  await page.locator("[data-m17-reset]").click();
  await expect(rows).toHaveCount(0);
  await expect(page.locator("[data-m17-title]")).toHaveValue("");
  await expect(result).toContainText("NOTHING PRODUCED");
  await expect(page.locator("[data-m17-title]")).toBeFocused();

  await expect(page.getByRole("button",{name:/generate|render|renderize|publish|upload|export/i})).toHaveCount(0);
  await expect(page.locator("img,video,iframe,form,script[src^='https://']")).toHaveCount(0);

  for(const width of NARROW)await overflowAt(page,width);
  const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);

  await page.locator("[data-m17-title]").fill("Another fictional title for practice");
  await page.reload();
  await expect(rows).toHaveCount(0);
  await expect(page.locator("[data-m17-title]")).toHaveValue("");
  expect(seen.remote).toEqual([]);
  expect(seen.writes).toEqual([]);
  expect(seen.crashes).toEqual([]);
});

test("M17 composer refuses to portray generated artwork as authentic reporting",async({page})=>{
  await page.goto("/demo/storyboard");
  const result=page.locator("[data-m17-result]");
  await page.locator("[data-m17-title]").fill("A fictional story with authentic photo inside");
  await page.locator("[data-m17-caption]").fill("Fictional cover for the invented practice story");
  await page.locator("[data-m17-add]").click();
  await page.locator("[data-m17-plan]").click();
  await expect(result).toContainText("REFUSED");
  await expect(result).toContainText("INVALID_BRIEF");

  const body=await page.locator("main").innerText();
  for(const marker of ["LOCAL SYNTHETIC","NOT ADMITTED","NO MEDIA PRODUCED","NO PROVIDER"]){
    expect(body).toContain(marker);
  }
  for(const url of ["/admin","/admin/login"]){
    expect((await page.request.get(url)).status()).toBeGreaterThanOrEqual(400);
  }
});
