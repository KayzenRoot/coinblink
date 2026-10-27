import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Every HTML surface the product ships, in one sweep. Per-module specs cover
// behaviour; this contract covers the invariants that must hold on all of them.
const HTML_SURFACES=[
  {path:"/en",lang:"en"},
  {path:"/pt-br",lang:"pt-BR"},
  {path:"/es",lang:"es"},
  {path:"/en/news",lang:"en"},
  {path:"/pt-br/news",lang:"pt-BR"},
  {path:"/es/news",lang:"es"},
  {path:"/developers",lang:"en"},
  {path:"/demo",lang:"en"},
  {path:"/demo/sources",lang:"en"},
  {path:"/demo/markets",lang:"en"},
  {path:"/demo/research",lang:"en"},
  {path:"/demo/newsletter",lang:"en"},
  {path:"/demo/api-usage",lang:"en"},
  {path:"/demo/placements",lang:"en"},
  {path:"/demo/incident-drill",lang:"en"},
  {path:"/demo/launch-readiness",lang:"en"},
  {path:"/demo/watchlist",lang:"en"},
  {path:"/demo/storyboard",lang:"en"},
  {path:"/demo/editorial/articles",lang:"en"},
  {path:"/demo/editorial/articles/new",lang:"en"},
  {path:"/demo/editorial/settings",lang:"en"},
  {path:"/demo/editorial/settings/integrations",lang:"en"},
];

test("every shipped surface keeps the shared demo invariants",async({page})=>{
  test.slow();
  const foreign=[];
  const crashes=[];
  page.on("request",(request)=>{
    const url=request.url();
    if(!url.startsWith("http://127.0.0.1:4321/")&&!url.startsWith("data:"))foreign.push(url);
  });
  page.on("pageerror",(error)=>crashes.push(error.message));
  const failures=[];
  for(const surface of HTML_SURFACES){
    const response=await page.goto(surface.path);
    const seen=[];
    if(response?.status()!==200)seen.push(`status ${response?.status()}`);
    const lang=await page.locator("html").getAttribute("lang");
    if(lang!==surface.lang)seen.push(`lang ${lang}`);
    const headings=page.locator("h1");
    const headingCount=await headings.count();
    if(headingCount!==1)seen.push(`h1 count ${headingCount}`);
    else if(((await headings.first().innerText())||"").trim()==="")seen.push("empty h1");
    const robots=await page.locator('meta[name="robots"]').getAttribute("content");
    if(robots!=="noindex, nofollow, noarchive")seen.push(`robots ${robots}`);
    const title=(await page.title()).trim();
    if(title==="")seen.push("empty title");
    const ogTitle=await page.locator('meta[property="og:title"]').getAttribute("content");
    if(ogTitle!==title)seen.push(`og:title ${ogTitle}`);
    const ogLocale=await page.locator('meta[property="og:locale"]').getAttribute("content");
    if(!ogLocale)seen.push("missing og:locale");
    if(await page.locator('link[rel="canonical"]').count()>0)seen.push("canonical without origin");
    if(await page.locator('link[rel="alternate"][hreflang]').count()>0)seen.push("hreflang without origin");
    if(seen.length>0)failures.push(`${surface.path}: ${seen.join("; ")}`);
    // A page with a wrong language tag also fails the axe language rule, so the
    // scan doubles as a second opinion on the document language.
    const scan=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
    for(const violation of scan.violations)failures.push(`${surface.path}: axe ${violation.id}`);
  }
  expect(failures).toEqual([]);
  expect(crashes).toEqual([]);
  expect(foreign).toEqual([]);
});

test("unknown paths render the styled 404 surface",async({page})=>{
  for(const path of ["/nao-existe-xyz","/404"]){
    const response=await page.goto(path);
    expect(response?.status(),`${path} must not be served`).toBe(404);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content","noindex, nofollow, noarchive");
  }
});

test("the protected admin tree stays an indistinguishable bare refusal",async({page,request})=>{
  for(const path of ["/admin","/admin/login","/admin/articles"]){
    const response=await page.goto(path);
    expect(response?.status(),`${path} must not be served`).toBe(404);
    // The refusal must not render the product shell or disclose an admin form.
    await expect(page.locator("h1"),`${path} must not render a heading`).toHaveCount(0);
    await expect(page.locator("form,input,button")).toHaveCount(0);
  }
  const api=await request.get("/v1/demo/articles");
  expect(api.status()).toBe(200);
  expect(String(api.headers()["content-type"])).toContain("application/json");
  expect(await api.text()).not.toContain("<html");
});
