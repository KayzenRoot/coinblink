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
