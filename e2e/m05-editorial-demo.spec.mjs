import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const publicDemoRoutes = [
  ["/demo/editorial", "Article workspace"],
  ["/demo/editorial/articles", "Article workspace"],
  ["/demo/editorial/articles/new", "Draft creation preview"],
  ["/demo/editorial/settings", "Settings overview"],
  ["/demo/editorial/settings/integrations", "Integration catalog"],
];

test.describe("M05 public static editorial demonstration", () => {
  for (const [path, heading] of publicDemoRoutes) {
    test(`renders ${path} as a safe nonprivileged mock`, async ({ page }) => {
      const errors = [];
      const externalRequests = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => {
        if (new URL(request.url()).origin !== "http://127.0.0.1:4321") {
          externalRequests.push(request.url());
        }
      });

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/CoinBlink.*MOCK/);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(page.getByText("MOCK / SECURITY DISABLED", { exact: true })).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow, noarchive");
      await expect(page.locator("main#main")).toHaveCount(1);
      await expect(page.locator('nav[aria-label="Security mock previews"]')).toHaveCount(0);
      await expect(page.locator("form")).toHaveCount(0);
      if (path.endsWith("/articles/new")) {
        await expect(page.locator("[data-m05-local-editor] input")).toHaveCount(4);
        await expect(page.locator("[data-m05-local-editor] textarea")).toHaveCount(2);
        await expect(page.getByText("NO CLOUD SAVE", { exact: true })).toBeVisible();
      } else {
        await expect(page.locator("input, textarea")).toHaveCount(0);
      }
      const buttons = page.locator(".m05-workspace button");
      for (const button of await buttons.all()) {
        await expect(button).toBeDisabled();
      }
      const navigation = await page.locator('nav[aria-label="Workspace"] a').evaluateAll((links) => links.map((link) => link.getAttribute("href")));
      expect(navigation.length).toBe(3);
      expect(navigation.every((href) => href?.startsWith("/demo/editorial/"))).toBe(true);
      expect(await page.evaluate(() => document.cookie)).toBe("");
      expect(errors).toEqual([]);
      expect(externalRequests).toEqual([]);
      expect(response?.headers()["content-security-policy"]).toContain("script-src 'self'");
      expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow, noarchive");
    });
  }

  test("article draft locally previews original text and downloads Markdown, without API calls or persistence", async ({ page }) => {
    const externalRequests = [];
    const sentMutations = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.origin !== "http://127.0.0.1:4321") externalRequests.push(request.url());
      if (!["GET", "HEAD"].includes(request.method())) sentMutations.push(request.url());
    });
    await page.goto("/demo/editorial/articles/new");
    const lab = page.locator("[data-m05-local-editor]");
    const exportButton = lab.getByRole("button", { name: "Export Markdown (.md)" });
    await expect(exportButton).toBeDisabled();
    await lab.locator("[data-m05-draft-title]").fill("Original security research article");
    await lab.locator("[data-m05-draft-author]").fill("CoinBlink Research");
    await lab.locator("[data-m05-draft-summary]").fill("An original overview of security practices and independently verifiable research.");
    await lab.locator("[data-m05-draft-body]").fill("An independently authored draft that must be fact checked and cleared for reuse before publication.");
    await lab.locator("[data-m05-draft-source]").fill("javascript:alert(1)");
    await expect(exportButton).toBeDisabled();
    await lab.locator("[data-m05-draft-source]").fill("https://example.org/research/source");
    await expect(exportButton).toBeEnabled();
    await expect(lab.locator("[data-m05-preview-title]")).toHaveText("Original security research article");
    await expect(lab.locator("[data-m05-preview-source]")).toHaveText("https://example.org/research/source");
    await expect(lab.locator("[data-m05-preview-status]")).toContainText("NOT fact-checked or approved");
    const [download] = await Promise.all([page.waitForEvent("download"), exportButton.click()]);
    expect(download.suggestedFilename()).toBe("original-security-research-article.md");
    const contents = await readFile(await download.path(), "utf8");
    expect(contents).toContain("# Original security research article");
    expect(contents).toContain("https://example.org/research/source");
    expect(contents).toContain("WORKING DRAFT ONLY");
    expect(contents).toContain("Request owner review before any publication");
    await expect(lab.locator("[data-m05-draft-hint]")).toContainText("Nothing was published");
    expect(sentMutations).toEqual([]);
    expect(externalRequests).toEqual([]);
    expect(page.url()).toBe("http://127.0.0.1:4321/demo/editorial/articles/new");
    await page.reload();
    await expect(lab.locator("[data-m05-draft-title]")).toHaveValue("");
    await expect(exportButton).toBeDisabled();
    await expect(page.getByText("MOCK / SECURITY DISABLED", { exact: true })).toBeVisible();
  });

  test("draft export can be reopened after reload and exported again without network writes", async ({ page }) => {
    const remoteCalls = [];
    page.on("request", request => {
      const url = new URL(request.url());
      if (url.origin !== "http://127.0.0.1:4321" || !["GET", "HEAD"].includes(request.method())) {
        remoteCalls.push(request.url());
      }
    });
    await page.goto("/demo/editorial/articles/new");
    const lab = page.locator("[data-m05-local-editor]");
    const title = lab.locator("[data-m05-draft-title]");
    const input = lab.locator("[data-m05-import]");
    const exportButton = lab.getByRole("button", { name: "Export Markdown (.md)" });
    await title.fill("Verified local backup article");
    await lab.locator("[data-m05-draft-author]").fill("Original Editorial");
    await lab.locator("[data-m05-draft-summary]").fill("An independently written summary of the new source-backed report.");
    await lab.locator("[data-m05-draft-body]").fill("A complete draft body that will be checked by the Owner after being saved to Markdown.");
    await lab.locator("[data-m05-draft-source]").fill("https://example.org/source/story");
    const [firstDownload] = await Promise.all([page.waitForEvent("download"), exportButton.click()]);
    const original = await readFile(await firstDownload.path(), "utf8");

    await page.reload();
    await expect(lab.locator("[data-m05-draft-title]")).toHaveValue("");
    await input.setInputFiles({ name: "verified-local-backup-article.md", mimeType: "text/markdown", buffer: Buffer.from(original) });
    await expect(lab.locator("[data-m05-import-status]")).toContainText("Nothing was uploaded");
    await expect(title).toHaveValue("Verified local backup article");
    await expect(lab.locator("[data-m05-draft-author]")).toHaveValue("Original Editorial");
    await expect(lab.locator("[data-m05-draft-source]")).toHaveValue("https://example.org/source/story");
    await expect(exportButton).toBeEnabled();
    await lab.locator("[data-m05-draft-body]").fill("A revised draft body that is still entirely local and requires independent verification.");
    const [secondDownload] = await Promise.all([page.waitForEvent("download"), exportButton.click()]);
    const revised = await readFile(await secondDownload.path(), "utf8");
    expect(revised).toContain("A revised draft body");
    expect(revised).toContain("WORKING DRAFT ONLY");
    expect(remoteCalls).toEqual([]);

    await title.fill("My current work must be retained");
    await input.setInputFiles({
      name: "untrusted.md", mimeType: "text/markdown",
      buffer: Buffer.from("# Not CoinBlink Markdown\n<script>bad</script>"),
    });
    await expect(lab.locator("[data-m05-import-status]")).toContainText("Current text was kept");
    await expect(title).toHaveValue("My current work must be retained");
    await input.setInputFiles({
      name: "oversize.md", mimeType: "text/markdown",
      buffer: Buffer.from("x".repeat(65000)),
    });
    await expect(lab.locator("[data-m05-import-status]")).toContainText("smaller than 64 KB");
    await expect(title).toHaveValue("My current work must be retained");
  });

  test("headlines with hashtags and literal hash entities survive browser export/import", async ({ page }) => {
    await page.goto("/demo/editorial/articles/new");
    const lab = page.locator("[data-m05-local-editor]");
    const headline = lab.locator("[data-m05-draft-title]");
    const exportButton = lab.getByRole("button", { name: "Export Markdown (.md)" });
    const originalTitle = "Bitcoin #1 research and literal &#35; references";
    await headline.fill(originalTitle);
    await lab.locator("[data-m05-draft-author]").fill("Local research");
    await lab.locator("[data-m05-draft-summary]").fill("Research on stable headline metadata with Markdown formatting characters.");
    await lab.locator("[data-m05-draft-body]").fill("An original local draft about Bitcoin #1 that has not been fact-checked or published.");
    await lab.locator("[data-m05-draft-source]").fill("https://example.org/research/bitcoin");
    await expect(exportButton).toBeEnabled();
    const [download] = await Promise.all([page.waitForEvent("download"), exportButton.click()]);
    const saved = await readFile(await download.path(), "utf8");
    expect(saved).toContain("# Bitcoin &#35;1 research and literal &amp;&#35;35; references");
    await page.reload();
    await lab.locator("[data-m05-import]").setInputFiles({
      name: "bitcoin-hashtag-draft.md", mimeType: "text/markdown", buffer: Buffer.from(saved),
    });
    await expect(lab.locator("[data-m05-import-status]")).toContainText("Nothing was uploaded");
    await expect(headline).toHaveValue(originalTitle);
    await expect(exportButton).toBeEnabled();
  });

  test("local drafting never interprets unsafe HTML and stays accessible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/demo/editorial/articles/new");
    const lab = page.locator("[data-m05-local-editor]");
    await lab.locator("[data-m05-draft-title]").fill("Security notes <img src=x onerror=alert(1)>");
    await lab.locator("[data-m05-draft-summary]").fill("This draft includes raw angle bracket input for the secure preview.");
    await lab.locator("[data-m05-draft-body]").fill("A long enough draft with untrusted <script>console.log('x')</script> text that is not executable.");
    await lab.locator("[data-m05-draft-source]").fill("https://example.org/original");
    await expect(lab.locator("[data-m05-preview-title]")).toContainText("<img src=x onerror=alert(1)>");
    await expect(lab.locator(".m05-draft-preview img, .m05-draft-preview script")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
    expect(await page.evaluate(() => ({ cookies: document.cookie, local: localStorage.length, session: sessionStorage.length })))
      .toEqual({ cookies: "", local: 0, session: 0 });
  });

  test("public mock routes never expose auth, recovery or real admin endpoints", async ({ request }) => {
    for (const path of [
      "/demo/editorial/login",
      "/demo/editorial/setup",
      "/demo/editorial/recovery",
      "/admin",
      "/admin/articles",
      "/admin/login",
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
      expect(response.headers()["set-cookie"], path).toBeUndefined();
    }
  });

  for (const viewport of [
    { name: "desktop", width: 1536, height: 864 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`articles are keyboard-accessible at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/demo/editorial/articles");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
      await expect(page.locator('a[href="/demo/editorial/articles/new"]')).toBeVisible();
    });
  }

  test("protects unexported draft changes and safely creates a new blank draft without storage", async ({ page }) => {
    const external = [];
    page.on("request", req => {
      if (new URL(req.url()).origin !== "http://127.0.0.1:4321" || !["GET", "HEAD"].includes(req.method())) {
        external.push(req.url());
      }
    });
    await page.goto("/demo/editorial/articles/new");
    const lab = page.locator("[data-m05-local-editor]");
    const title = lab.locator("[data-m05-draft-title]");
    const startNew = lab.getByRole("button", { name: "Start a new draft" });
    await expect(startNew).toBeDisabled();
    await title.fill("Unexported editorial notes");
    await expect(startNew).toBeEnabled();
    await expect(lab.locator("[data-m05-save-state]")).toContainText("Unexported changes");
    expect(await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    })).toBe(true);

    page.once("dialog", dialog => dialog.dismiss());
    await startNew.click();
    await expect(title).toHaveValue("Unexported editorial notes");

    page.once("dialog", dialog => dialog.accept());
    await startNew.click();
    await expect(title).toHaveValue("");
    await expect(startNew).toBeDisabled();
    await expect(lab.locator("[data-m05-save-state]")).toContainText("No edits since last import");

    await title.fill("New offline editorial draft");
    await lab.locator("[data-m05-draft-summary]").fill("An original summary, with attribution still pending human review.");
    await lab.locator("[data-m05-draft-body]").fill("An entirely local editorial body that is not verified or published anywhere.");
    await lab.locator("[data-m05-draft-source]").fill("https://example.org/editorial/original");
    const exportButton = lab.getByRole("button", { name: "Export Markdown (.md)" });
    const [download] = await Promise.all([page.waitForEvent("download"), exportButton.click()]);
    const markdown = await readFile(await download.path(), "utf8");
    await expect(lab.locator("[data-m05-save-state]")).toContainText("No edits since last import");
    await lab.locator("[data-m05-draft-body]").fill("This revised local body is not exported, and it must not be replaced without consent.");
    const current = await lab.locator("[data-m05-draft-body]").inputValue();
    page.once("dialog", dialog => dialog.dismiss());
    await lab.locator("[data-m05-import]").setInputFiles({
      name: "local-backup.md", mimeType: "text/markdown", buffer: Buffer.from(markdown),
    });
    await expect(lab.locator("[data-m05-import-status]")).toContainText("Import canceled");
    await expect(lab.locator("[data-m05-draft-body]")).toHaveValue(current);
    expect(await page.evaluate(() => [document.cookie, localStorage.length, sessionStorage.length])).toEqual(["", 0, 0]);
    expect(external).toEqual([]);
  });

});
