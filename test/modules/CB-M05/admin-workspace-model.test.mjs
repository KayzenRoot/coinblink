import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { ADMIN_WORKSPACE_VIEWS, getAdminWorkspaceView } from "../../../src/modules/CB-M05/admin-workspace-model.mjs";

const component = readFileSync(resolve("src/modules/CB-M05/AdminWorkspace.astro"), "utf8");

test("M05 exposes only the eight admitted static workspace views", () => {
  assert.deepEqual(ADMIN_WORKSPACE_VIEWS, [
    "login",
    "setup",
    "recovery",
    "articles",
    "article-new",
    "article-edit",
    "settings",
    "integrations",
  ]);
});

test("every view advertises MOCK / SECURITY DISABLED and offers no action", () => {
  for (const view of ADMIN_WORKSPACE_VIEWS) {
    const model = getAdminWorkspaceView(view);
    assert.equal(model.view, view);
    assert.equal(model.mode, "MOCK");
    assert.equal(model.securityEnabled, false);
    assert.equal(model.actionsEnabled, false);
    assert.ok(model.title.trim().length > 0);
    assert.ok(model.description.trim().length > 0);
    assert.match(model.safetyMessage, /MOCK.*SECURITY DISABLED/u);
  }
});

test("unknown view values fail closed instead of falling back to another screen", () => {
  assert.throws(() => getAdminWorkspaceView("publish"), /Unknown M05 workspace view/u);
  assert.throws(() => getAdminWorkspaceView(""), /Unknown M05 workspace view/u);
});

test("article and provider preview data contains no article claims or secret values", () => {
  const articles = getAdminWorkspaceView("articles");
  const integrations = getAdminWorkspaceView("integrations");
  assert.deepEqual(articles.records, []);
  assert.deepEqual(integrations.providers.map(({ status }) => status), ["Not connected", "Not connected", "Not connected"]);
  assert.equal("secret" in integrations, false);
  assert.equal("apiKey" in integrations, false);
  assert.ok(integrations.providers.every(({ credentialState }) => credentialState === "No credential configured"));
});

test("workspace template stays presentation-only and keeps every side-effect control disabled", () => {
  assert.match(component, /MOCK \/ SECURITY DISABLED/u);
  assert.doesNotMatch(component, /<(?:form|input|textarea|script)\b/iu);
  assert.doesNotMatch(component, /\b(?:fetch\s*\(|localStorage|sessionStorage|document\.cookie|client:[a-z]+)/iu);

  const buttons = [...component.matchAll(/<button\b[^>]*>/giu)].map(([tag]) => tag);
  assert.ok(buttons.length > 0, "the mock must show the unavailable action treatment");
  assert.ok(buttons.every((tag) => /\bdisabled(?:\s|>|=)/iu.test(tag)), "every action button remains disabled in P0");

  const adminPaths = [...component.matchAll(/href="(\/admin[^"]*)"/giu)].map(([, href]) => href);
  assert.ok(adminPaths.length > 0);
  assert.equal(adminPaths.includes("/admin"), false, "P0 does not add an unapproved /admin root route");
  assert.ok(adminPaths.every((href) => href.startsWith("/admin/articles") || href.startsWith("/admin/settings") || ["/admin/login", "/admin/setup", "/admin/recovery"].includes(href)));
});
