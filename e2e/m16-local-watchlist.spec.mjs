import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WIDTHS=[320,390,768,1366,1536];

function watchFor(tracked){
  return (page)=>{
    page.on("request",(request)=>{
      const url=request.url();
      if(!url.startsWith("http://127.0.0.1:4321/")&&!url.startsWith("data:"))tracked.remote.push(url);
      if(request.method()!=="GET"&&request.method()!=="HEAD")tracked.mutations.push(url);
    });
    page.on("pageerror",(error)=>tracked.crashes.push(error.message));
  };
}

async function assertNoSidewaysScroll(page){
  for(const width of WIDTHS){
    await page.setViewportSize({width,height:900});
    const box=await page.evaluate(()=>({
      seen:document.documentElement.clientWidth,
      drawn:document.documentElement.scrollWidth,
    }));
    expect(box.drawn,`horizontal overflow at ${width}px`).toBeLessThanOrEqual(box.seen);
  }
}

test("M16 ordered watchlist preview reorders by keyboard and still delivers nothing",async({page})=>{
  const tracked={remote:[],mutations:[],crashes:[]};
  watchFor(tracked)(page);
  const response=await page.goto("/demo/watchlist");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading",{name:"Local watchlist preview"})).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/u);

  const add=page.locator("[data-m16-add]");
  const rows=page.locator("[data-m16-order] > li");
  const count=page.locator("[data-m16-progress]");
  const verdict=page.locator("[data-m16-verdict]");
  const direction=page.locator("[data-m16-direction]");
  await expect(add).toHaveCount(4);
  await expect(rows).toHaveCount(0);
  await expect(page.locator("[data-m16-empty]")).toBeVisible();
  await expect(count).toContainText("0 of 4");

  for(const id of ["btc","eth","stable"]){
    await page.locator(`[data-m16-add="${id}"]`).click();
  }
  await expect(rows).toHaveCount(3);
  await expect(count).toContainText("3 of 4");
  await expect(page.locator("[data-m16-empty]")).toBeHidden();
  const names=await rows.allInnerTexts();
  expect(names[0]).toContain("Bitcoin");
  expect(names[2]).toContain("stablecoin");

  await page.locator('[data-m16-move="down"][data-m16-id="btc"]').click();
  expect((await rows.allInnerTexts())[1]).toContain("Bitcoin");
  expect((await rows.allInnerTexts())[2]).toContain("stablecoin");
  await expect(count).toContainText("3 of 4");
  await expect(verdict).toContainText("ALERTS DISABLED");

  const moveUp=page.locator('[data-m16-move="up"][data-m16-id="btc"]');
  await moveUp.focus();
  await page.keyboard.press("Enter");
  expect((await rows.allInnerTexts())[0]).toContain("Bitcoin");
  await expect(page.locator('[data-m16-move][data-m16-id="btc"]:focus')).toHaveCount(1,
    "keyboard focus stays on the reordered entry");
  await expect(page.locator('[data-m16-move="up"][data-m16-id="btc"]')).toBeDisabled();

  await direction.selectOption("below");
  await expect(verdict).toContainText("notional direction below");
  await expect(verdict).toContainText("ALERTS DISABLED");

  await page.locator('[data-m16-remove="eth"]').click();
  await expect(rows).toHaveCount(2);
  await expect(page.locator('[data-m16-add="eth"]')).toBeEnabled();

  await expect(page.getByRole("button",{name:/subscribe|alert me|notify|enable|trade|sign in|log in/i})).toHaveCount(0);
  await expect(page.locator("input,form")).toHaveCount(0);

  await assertNoSidewaysScroll(page);
  const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);

  await page.reload();
  await expect(rows).toHaveCount(0);
  await expect(count).toContainText("0 of 4");
  await expect(page.locator("[data-m16-add]")).toHaveCount(4);
  expect(tracked.remote).toEqual([]);
  expect(tracked.mutations).toEqual([]);
  expect(tracked.crashes).toEqual([]);
});

test("M16 preview refuses to stand in for a live alert service",async({page})=>{
  await page.goto("/demo/watchlist");
  const body=await page.locator("main").innerText();
  for(const marker of ["LOCAL SYNTHETIC","NOT ADMITTED","ALERTS DISABLED","NO ACCOUNT","NO LIVE ALERTS"]){
    expect(body).toContain(marker);
  }
  await expect(page.locator("iframe,img,form,script[src^='https://']")).toHaveCount(0);
  for(const url of ["/admin","/admin/login"]){
    expect((await page.request.get(url)).status()).toBeGreaterThanOrEqual(400);
  }
});
