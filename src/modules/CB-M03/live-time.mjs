// CB-M03-P1-RELATIVE-TIME-001: localized age for headline timestamps.
//
// The visible label is relative ("2 hours ago", "há 2 horas"), while the exact
// UTC instant stays on the <time datetime> attribute and its title. The helper
// is pure and deterministic once `nowMs` is provided.
const NOW_LABEL = Object.freeze({ en: "just now", "pt-br": "agora", es: "ahora" });
const BCP47 = Object.freeze({ en: "en", "pt-br": "pt-BR", es: "es" });
const formatters = new Map();

function formatterFor(locale) {
  const tag = Object.hasOwn(BCP47, locale) ? BCP47[locale] : BCP47.en;
  let formatter = formatters.get(tag);
  if (formatter === undefined) {
    formatter = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
    formatters.set(tag, formatter);
  }
  return formatter;
}

/** Relative age, or null when the timestamp is missing or unparseable. */
export function formatLiveAge(iso, nowMs, locale = "en") {
  if (typeof iso !== "string") return null;
  const published = Date.parse(iso);
  if (!Number.isFinite(published)) return null;
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - published) / 1000));
  if (elapsedSeconds < 60) {
    return Object.hasOwn(NOW_LABEL, locale) ? NOW_LABEL[locale] : NOW_LABEL.en;
  }
  const formatter = formatterFor(locale);
  if (elapsedSeconds < 3600) {
    return formatter.format(-Math.floor(elapsedSeconds / 60), "minute");
  }
  if (elapsedSeconds < 86400) {
    return formatter.format(-Math.floor(elapsedSeconds / 3600), "hour");
  }
  return formatter.format(-Math.floor(elapsedSeconds / 86400), "day");
}

/** Exact UTC label for the tooltip, or an empty string when unknown. */
export function exactLiveTime(iso) {
  if (typeof iso !== "string") return "";
  const published = Date.parse(iso);
  if (!Number.isFinite(published)) return "";
  return new Date(published).toISOString().slice(0, 16).replace("T", " ") + " UTC";
}
