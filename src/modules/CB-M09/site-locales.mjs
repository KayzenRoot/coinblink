// CB-M09-P1: locale and metadata planning. Absolute metadata stays absent until
// a real origin is configured, so the DEMO build never invents a canonical URL.
export const SITE_LOCALES = Object.freeze(["en", "pt-br", "es"]);
export const DEMO_ROBOTS = "noindex, nofollow, noarchive";
export const SOCIAL_IMAGE_PATH = "/brand/og-image.jpg";
export const DEFAULT_LOCALE = "en";
const OG_LOCALE = Object.freeze({ en: "en_US", "pt-BR": "pt_BR", es: "es_ES" });
// The layout prop is a BCP-47 language tag; the site registry uses lowercase
// locale slugs. Keep both mappings explicit instead of guessing.
const LANG_TO_LOCALE = Object.freeze({ en: "en", "pt-BR": "pt-br", es: "es" });
const BCP47_BY_LOCALE = Object.freeze({ en: "en", "pt-br": "pt-BR", es: "es" });
const ORIGIN_PATTERN = /^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*(?::\d{1,5})?$/u;
const LOCALE_SET = new Set(SITE_LOCALES);

export function listSiteLocales() {
  return SITE_LOCALES;
}

/** Normalize a configured site origin. Absent means null; malformed throws. */
export function resolveSiteOrigin(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !ORIGIN_PATTERN.test(value)) {
    throw new TypeError("PUBLIC_SITE_ORIGIN must be an https origin without a trailing slash");
  }
  return value;
}

/**
 * Sibling paths of a localized route, one per site locale, or null when the
 * route is not localized (for example "/" or a demo lab). Non-localized routes
 * must never receive hreflang alternates that would not exist.
 */
export function localeSiblings(pathname) {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) return null;
  // A trailing slash would describe an ambiguous URL, so it never gets alternates.
  if (pathname.length > 1 && pathname.endsWith("/")) return null;
  const segments = pathname.split("/");
  // An absolute path splits as ["", locale, ...rest].
  if (segments.length < 2 || !LOCALE_SET.has(segments[1])) return null;
  const rest = segments.slice(2).join("/");
  const siblings = {};
  for (const locale of SITE_LOCALES) siblings[locale] = "/" + locale + (rest ? "/" + rest : "");
  return Object.freeze(siblings);
}

/** Build the server-rendered metadata plan for one page. */
export function buildSeoMetadata({ pathname, lang, title, description, origin } = {}) {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) {
    throw new TypeError("pathname must be an absolute site path");
  }
  if (!Object.hasOwn(LANG_TO_LOCALE, lang)) {
    throw new TypeError("lang must be one of en, pt-BR or es");
  }
  for (const [label, value] of [["title", title], ["description", description]]) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new TypeError(`${label} must be a non-empty string`);
    }
  }
  const resolvedOrigin = resolveSiteOrigin(origin);
  const siblings = localeSiblings(pathname);
  // A canonical identifies this page whenever a real origin exists. Language
  // alternates only exist for routes that are actually localized.
  const canonical = resolvedOrigin ? resolvedOrigin + pathname : null;
  const alternates = [];
  if (resolvedOrigin && siblings) {
    for (const locale of SITE_LOCALES) {
      alternates.push(Object.freeze({ hreflang: BCP47_BY_LOCALE[locale],
        href: resolvedOrigin + siblings[locale] }));
    }
    alternates.push(Object.freeze({ hreflang: "x-default", href: resolvedOrigin + siblings[DEFAULT_LOCALE] }));
  }
  return Object.freeze({
    lang: lang,
    robots: DEMO_ROBOTS,
    absolute: canonical !== null,
    canonical,
    alternates: Object.freeze(alternates),
    openGraph: Object.freeze({
      type: "website",
      siteName: "CoinBlink",
      title,
      description,
      locale: OG_LOCALE[lang],
      url: canonical,
      image: canonical === null ? null : resolvedOrigin + SOCIAL_IMAGE_PATH,
    }),
    twitter: Object.freeze({ card: "summary" }),
  });
}
