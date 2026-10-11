export const ADMIN_WORKSPACE_VIEWS = Object.freeze([
  "login",
  "setup",
  "recovery",
  "articles",
  "article-new",
  "article-edit",
  "settings",
  "integrations",
]);

/** @typedef {{ name: string, status: string, credentialState: string }} ProviderCard */
/** @typedef {{ title: string, description: string, state: "empty" | "unavailable", records?: readonly unknown[], providers?: readonly ProviderCard[] }} ViewContent */

const safetyMessage = "MOCK · SECURITY DISABLED — this static preview does not collect credentials or change data.";

const providerCards = Object.freeze([
  Object.freeze({ name: "Editorial research", status: "Not connected", credentialState: "No credential configured" }),
  Object.freeze({ name: "Market data", status: "Not connected", credentialState: "No credential configured" }),
  Object.freeze({ name: "Notifications", status: "Not connected", credentialState: "No credential configured" }),
]);

/** @type {Readonly<Record<string, ViewContent>>} */
const views = Object.freeze({
  login: Object.freeze({ title: "Sign-in preview", description: "Authentication is not available in this P0 mock. No sign-in form or session is provided.", state: "unavailable" }),
  setup: Object.freeze({ title: "Owner setup preview", description: "Owner activation is not available in this P0 mock. No account can be created here.", state: "unavailable" }),
  recovery: Object.freeze({ title: "Recovery preview", description: "Account recovery is not available in this P0 mock. No email or recovery code is requested.", state: "unavailable" }),
  articles: Object.freeze({ title: "Article workspace", description: "No demonstration articles are loaded. Live editorial content is not connected.", state: "empty", records: Object.freeze([]) }),
  "article-new": Object.freeze({ title: "Draft creation preview", description: "Draft creation is disabled. This view contains no writable editor or publishing action.", state: "unavailable", records: Object.freeze([]) }),
  "article-edit": Object.freeze({ title: "Draft review preview", description: "No article is selected. Editing, approval, and publication are disabled.", state: "empty", records: Object.freeze([]) }),
  settings: Object.freeze({ title: "Settings overview", description: "Settings are read-only in this P0 mock. No account or provider values are stored.", state: "unavailable", providers: providerCards }),
  integrations: Object.freeze({ title: "Integration catalog", description: "Provider connections are not configured. This catalog contains categories only, not credentials or live status checks.", state: "empty", providers: providerCards }),
});

/** @param {string} view */
export function getAdminWorkspaceView(view) {
  if (!Object.hasOwn(views, view)) {
    throw new RangeError(`Unknown M05 workspace view: ${String(view)}`);
  }

  return Object.freeze({
    view,
    ...views[view],
    mode: "MOCK",
    securityEnabled: false,
    actionsEnabled: false,
    safetyMessage,
  });
}
