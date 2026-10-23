/* global document, MutationObserver */
// Read-only, deterministic editorial drafting indicators for the P0 local DEMO.
// No persistence, credential access, network requests, publication or fact-checking.
export const DEMO_READING_SPEED_WPM = 200;


// The editor stores internal source-note and claim-review appendices inside
// the Markdown textarea. Reading metrics are for the article, not audit data.
// This URL-served browser module must remain standalone under strict CSP.
const SOURCE_HEADING = "### CoinBlink source notes (unverified)";
const CLAIM_HEADING = "### CoinBlink claim review queue (local only)";
const SOURCE_MARKER = "\n\n" + SOURCE_HEADING + "\n";
const CLAIM_MARKER = "\n\n" + CLAIM_HEADING + "\n";
const SOURCE_LINE = /^\[\^cb([1-9]|1[0-2])\]: (.+) \| https:\/\/\S+$/u;
const CLAIM_LINE = /^\[CB-CLAIM-(0[1-9]|1[0-2]) \| (NEEDS_HUMAN_REVIEW|REVIEW_NOTED_NOT_VERIFIED) \| source=(none|cb(?:[1-9]|1[0-2]))\] (.{10,220})$/u;

function validAppendix(text, marker, pattern, limit) {
  const tail = text.slice(marker.length);
  if (!tail || tail.endsWith("\n\n")) return false;
  const lines = (tail.endsWith("\n") ? tail.slice(0, -1) : tail).split("\n");
  const ids = new Set();
  if (lines.length < 1 || lines.length > limit) return false;
  for (const line of lines) {
    const matched = pattern.exec(line);
    if (!matched || ids.has(matched[1])) return false;
    ids.add(matched[1]);
  }
  return true;
}

function articleOnly(body) {
  if (body.length > 12000) return body;
  const sourceAt = body.lastIndexOf(SOURCE_MARKER);
  const beforeSource = sourceAt < 0 ? body : body.slice(0, sourceAt);
  if ((sourceAt < 0 && body.includes(SOURCE_HEADING))
      || (sourceAt >= 0 && (beforeSource.includes(SOURCE_HEADING)
        || !validAppendix(body.slice(sourceAt), SOURCE_MARKER, SOURCE_LINE, 12)))) {
    return body;
  }
  const claimAt = beforeSource.lastIndexOf(CLAIM_MARKER);
  const prose = claimAt < 0 ? beforeSource : beforeSource.slice(0, claimAt);
  if ((claimAt < 0 && beforeSource.includes(CLAIM_HEADING))
      || (claimAt >= 0 && (prose.includes(CLAIM_HEADING)
        || !validAppendix(beforeSource.slice(claimAt), CLAIM_MARKER, CLAIM_LINE, 12)))) {
    return body;
  }
  return prose;
}


/**
 * @param {unknown} body
 * @returns {Readonly<{ words: number, characters: number, estimatedMinutes: number }>}
 */
export function measureLocalDraft(body) {
  const value = typeof body === "string" ? body : "";
  const article = articleOnly(value);
  const words = article.trim().match(/\S+/gu)?.length ?? 0;
  const characters = Array.from(article).length;
  const estimatedMinutes = words === 0 ? 0 : Math.ceil(words / DEMO_READING_SPEED_WPM);

  return Object.freeze({ words, characters, estimatedMinutes });
}

// This file is also served as a same-origin external module asset in the DEMO.
// Keep the pure exports usable by Node tests, and never persist or transmit data.
if (typeof document !== "undefined") {
  const root = document.querySelector("[data-m05-local-editor]");
  const body = root?.querySelector("[data-m05-draft-body]");
  const preview = root?.querySelector("[data-m05-preview-body]");
  const words = root?.querySelector("[data-m05-metric-words]");
  const characters = root?.querySelector("[data-m05-metric-characters]");
  const minutes = root?.querySelector("[data-m05-metric-minutes]");

  if (body && words && characters && minutes) {
    const update = () => {
      const result = measureLocalDraft(body.value);
      words.textContent = String(result.words);
      characters.textContent = String(result.characters);
      minutes.textContent = String(result.estimatedMinutes);
    };
    body.addEventListener("input", update);
    // React to the existing async local Markdown import, not a server request.
    if (preview && typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(update);
      observer.observe(preview, { childList: true, characterData: true, subtree: true });
    }
    update();
  }
}
