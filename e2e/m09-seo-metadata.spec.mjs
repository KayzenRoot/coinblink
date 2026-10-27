import {test,expect} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The local build has no PUBLIC_SITE_ORIGIN, so absolute metadata must stay absent.
const pages=[
  {path:"/en",lang:"en",ogLocale:"en_US"},
  {path:"/pt-br",lang:"pt-BR",ogLocale:"pt_BR"},
  {path:"/es",lang:"es",ogLocale:"es_ES"},
  {path:"/en/news",lang:"en",ogLocale:"en_US"},
  {path:"/pt-br/news",lang:"pt-BR",ogLocale:"pt_BR"},
  {path:"/es/news",lang:"es",ogLocale:"es_ES"},
];

test("M09 P1 every localized page declares its language and demo metadata",async({page})=>{
  const foreign=[];
  page.on("request",(request)=>{
    if(!request.url().startsWith("http://127.0.0.1:4321/")&&!request.url().startsWith("data:"))foreign.push(request.url());
  });
  for(const expected of pages){
    const response=await page.goto(expected.path);
    expect(response?.status(),`${expected.path} must resolve`).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang",expected.lang);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content","noindex, nofollow, noarchive");
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content",expected.ogLocale);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content",/.+/u);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content","CoinBlink");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content","website");
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content","summary");
    const title=await page.title();
    const ogTitle=await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle,`${expected.path} og:title must match the document title`).toBe(title);
    // No origin is configured, so absolute tags must not appear at all.
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  }
  expect(foreign).toEqual([]);
  const scan=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(scan.violations).toEqual([]);
});

test("M09 P1 a non-localized lab keeps its own language and claims no alternates",async({page})=>{
  await page.goto("/demo/sources");
  await expect(page.locator("html")).toHaveAttribute("lang","en");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content","en_US");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content","noindex, nofollow, noarchive");
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
