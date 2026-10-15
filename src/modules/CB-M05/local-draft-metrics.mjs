// Read-only, deterministic editorial drafting indicators for the P0 local DEMO.
// No persistence, credential access, network requests, publication or fact-checking.
export const DEMO_READING_SPEED_WPM = 200;

/**
 * @param {unknown} body
 * @returns {Readonly<{ words: number, characters: number, estimatedMinutes: number }>}
 */
export function measureLocalDraft(body) {
  const value = typeof body === "string" ? body : "";
  const words = value.trim().match(/\S+/gu)?.length ?? 0;
  const characters = Array.from(value).length;
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
