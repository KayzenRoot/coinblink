// CB-M03-P1-READER-LOCALE-001: switch the reader between site locales.
//
// Every reader route exists in the three site locales, so the switch only
// rewrites the first path segment and keeps the rest of the path and the query
// string. Unknown locales and paths never produce a guessed route.
export const READER_LOCALES = Object.freeze(["en", "pt-br", "es"]);

const BCP47 = Object.freeze({ en: "en", "pt-br": "pt-BR", es: "es" });
// Endonyms do not translate: each language is always named in itself.
const NAMES = Object.freeze({ en: "English", "pt-br": "Português (Brasil)", es: "Español" });
const LABELS = Object.freeze({ en: "Language", "pt-br": "Idioma", es: "Idioma" });

/** The BCP-47 tag for a reader locale, or "en" when the value is unknown. */
export function readerLocaleTag(locale) {
  return typeof locale === "string" && Object.hasOwn(BCP47, locale) ? BCP47[locale] : BCP47.en;
}

/** The language's own name, never translated. */
export function readerLocaleName(locale) {
  return typeof locale === "string" && Object.hasOwn(NAMES, locale) ? NAMES[locale] : NAMES.en;
}

/** The accessible label for the switch, localized. */
export function readerLocaleLabel(locale) {
  return typeof locale === "string" && Object.hasOwn(LABELS, locale) ? LABELS[locale] : LABELS.en;
}

function stripLocale(pathname, locale) {
  const prefix = "/" + locale;
  if (pathname === prefix) return "";
  if (pathname.startsWith(prefix + "/")) return pathname.slice(prefix.length);
  return null;
}

/**
 * The same reader path in every site locale, preserving the query string.
 * A pathname outside the current locale is not rewritten into a fake sibling.
 * @param {unknown} locale
 * @param {unknown} pathname
 * @param {unknown} [search]
 * @returns {Readonly<Record<string, string>>}
 */
export function readerLocaleLinks(locale, pathname, search = "") {
  if (typeof pathname !== "string" || !pathname.startsWith("/")) {
    throw new TypeError("pathname must be an absolute site path");
  }
  const rest = typeof locale === "string" ? stripLocale(pathname, locale) : null;
  if (rest === null) {
    throw new TypeError("pathname must start with the current locale");
  }
  const query = typeof search === "string" && search.startsWith("?") ? search : "";
  return Object.freeze(Object.fromEntries(
    READER_LOCALES.map((key) => [key, "/" + key + rest + query]),
  ));
}
