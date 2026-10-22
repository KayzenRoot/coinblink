/* global document, MutationObserver */
// M05 P0: local editorial claim queue in the article's Markdown body.
// No remote verification, persistence, identity, publication or automatic approval.
export const MAX_LOCAL_CLAIMS = 12;
export const LOCAL_CLAIM_HEADING = "### CoinBlink claim review queue (local only)";
export const LOCAL_CLAIM_PENDING = "NEEDS_HUMAN_REVIEW";
export const LOCAL_CLAIM_NOTED = "REVIEW_NOTED_NOT_VERIFIED";
const MAX_DRAFT = 12000;
const CLAIM_MARKER = "\n\n" + LOCAL_CLAIM_HEADING + "\n";
const SOURCE_HEADING = "### CoinBlink source notes (unverified)";
const SOURCE_MARKER = "\n\n" + SOURCE_HEADING + "\n";
const CLAIM_LINE = /^\[CB-CLAIM-(0[1-9]|1[0-2]) \| (NEEDS_HUMAN_REVIEW|REVIEW_NOTED_NOT_VERIFIED) \| source=(none|cb(?:[1-9]|1[0-2]))\] (.{10,220})$/u;
const SOURCE_LINE = /^\[\^cb([1-9]|1[0-2])\]: (.+) \| https:\/\/\S+$/u;

function parseLocalSourceIds(sourcePart) {
  const sourceIds = new Set();
  if (!sourcePart) return sourceIds;
  const lines = sourcePart.slice(SOURCE_MARKER.length).split("\n");
  if (lines.length < 1 || lines.length > MAX_LOCAL_CLAIMS) {
    throw new RangeError("Malformed source-note section");
  }
  for (const line of lines) {
    const match = SOURCE_LINE.exec(line);
    if (!match || sourceIds.has(Number(match[1]))) {
      throw new RangeError("Malformed or duplicate source note");
    }
    sourceIds.add(Number(match[1]));
  }
  return sourceIds;
}

function parseLocalClaimQueue(withClaims) {
  const queueIndex = withClaims.lastIndexOf(CLAIM_MARKER);
  const prose = queueIndex < 0 ? withClaims : withClaims.slice(0, queueIndex);
  if ((queueIndex < 0 && withClaims.includes(LOCAL_CLAIM_HEADING))
      || (queueIndex >= 0 && prose.includes(LOCAL_CLAIM_HEADING))) {
    throw new RangeError("Malformed or duplicate claim queue");
  }
  const claims = [];
  if (queueIndex < 0) return { prose, claims };
  const lines = withClaims.slice(queueIndex + CLAIM_MARKER.length).split("\n");
  if (lines.length < 1 || lines.length > MAX_LOCAL_CLAIMS) {
    throw new RangeError("Invalid claim count");
  }
  const ids = new Set();
  for (const line of lines) {
    const match = CLAIM_LINE.exec(line);
    if (!match || ids.has(Number(match[1])) || /[|<>\r\n]/u.test(match[4])) {
      throw new RangeError("Malformed or duplicate claim item");
    }
    const claim = Object.freeze({
      id: Number(match[1]), state: match[2],
      sourceId: match[3] === "none" ? null : Number(match[3].slice(2)),
      claim: match[4],
    });
    ids.add(claim.id);
    claims.push(claim);
  }
  return { prose, claims };
}

function parseBody(body) {
  if (typeof body !== "string" || body.length > MAX_DRAFT) {
    throw new RangeError("Local article exceeds its maximum size");
  }
  const sourceIndex = body.lastIndexOf(SOURCE_MARKER);
  const withClaims = sourceIndex < 0 ? body : body.slice(0, sourceIndex);
  const sourcePart = sourceIndex < 0 ? "" : body.slice(sourceIndex);
  if (sourceIndex < 0 && body.includes(SOURCE_HEADING)) {
    throw new RangeError("Malformed source-note section");
  }
  if (sourceIndex >= 0 && withClaims.includes(SOURCE_HEADING)) {
    throw new RangeError("Duplicate source-note section");
  }
  const sourceIds = parseLocalSourceIds(sourcePart);
  const { prose, claims } = parseLocalClaimQueue(withClaims);
  return { prose, claims, sourcePart, sourceIds };
}

function makeBody(parsed, claims) {
  const notes = claims.length ? CLAIM_MARKER + claims.map((item) => (
    "[CB-CLAIM-" + String(item.id).padStart(2, "0")
      + " | " + item.state
      + " | source=" + (item.sourceId === null ? "none" : "cb" + item.sourceId)
      + "] " + item.claim
  )).join("\n") : "";
  const result = parsed.prose + notes + parsed.sourcePart;
  if (result.length > MAX_DRAFT) throw new RangeError("Claim queue would exceed the article length limit");
  return result;
}

/** Read-only claim queue; a review note is not evidence, fact-check or approval. */
export function listLocalClaimReviews(body) {
  const parsed = parseBody(body);
  return Object.freeze(parsed.claims.map((item) => Object.freeze({
    ...item,
    sourceAvailable: item.sourceId === null || parsed.sourceIds.has(item.sourceId),
  })));
}

export function addLocalClaimReview(body, quote, sourceId = null) {
  const parsed = parseBody(body);
  if (parsed.claims.length >= MAX_LOCAL_CLAIMS) throw new RangeError("Maximum of 12 local review items reached");
  if (typeof quote !== "string") throw new RangeError("A claim must be plain text");
  const text = quote.trim();
  if (text.length < 10 || text.length > 220 || /[|<>\r\n]/u.test(text)) {
    throw new RangeError("A claim must contain 10 to 220 plain-text characters");
  }
  if (sourceId !== null && (!Number.isInteger(sourceId) || !parsed.sourceIds.has(sourceId))) {
    throw new RangeError("Claim source must refer to an existing local source note");
  }
  const ids = new Set(parsed.claims.map((item) => item.id));
  const id = Array.from({ length: MAX_LOCAL_CLAIMS }, (_, i) => i + 1).find((i) => !ids.has(i));
  const item = Object.freeze({ id, claim: text, sourceId, state: LOCAL_CLAIM_PENDING });
  return Object.freeze({ value: makeBody(parsed, [...parsed.claims, item]), item });
}

/** Review-noted is a manual process note, NOT checked, cleared or approved. */
export function markLocalClaimReview(body, id, reviewed) {
  const parsed = parseBody(body);
  if (!parsed.claims.some((item) => item.id === id)) throw new RangeError("Claim ID does not exist");
  const next = parsed.claims.map((item) => item.id === id
    ? { ...item, state: reviewed ? LOCAL_CLAIM_NOTED : LOCAL_CLAIM_PENDING } : item);
  return makeBody(parsed, next);
}

export function removeLocalClaimReview(body, id) {
  const parsed = parseBody(body);
  if (!parsed.claims.some((item) => item.id === id)) throw new RangeError("Claim ID does not exist");
  return makeBody(parsed, parsed.claims.filter((item) => item.id !== id));
}

if (typeof document !== "undefined") {
  const editor = document.querySelector("[data-m05-local-editor]");
  const panel = document.querySelector("[data-m05-claim-panel]");
  const body = editor?.querySelector("[data-m05-draft-body]");
  const preview = editor?.querySelector("[data-m05-preview-body]");
  const claimInput = panel?.querySelector("[data-m05-claim-input]");
  const sourceSelect = panel?.querySelector("[data-m05-claim-source]");
  const addButton = panel?.querySelector("[data-m05-claim-add]");
  const queue = panel?.querySelector("[data-m05-claim-list]");
  const count = panel?.querySelector("[data-m05-claim-count]");
  const status = panel?.querySelector("[data-m05-claim-status]");
  if (body && panel && claimInput && sourceSelect && addButton && queue && count && status) {
    const report = (message) => { status.textContent = message; };
    const apply = (value) => {
      body.value = value;
      body.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const render = () => {
      queue.replaceChildren();
      try {
        const parsed = parseBody(body.value);
        const items = listLocalClaimReviews(body.value);
        const previous = sourceSelect.value;
        sourceSelect.replaceChildren();
        const option = (value, label) => {
          const node = document.createElement("option");
          node.value = value;
          node.textContent = label;
          sourceSelect.append(node);
        };
        option("", "No source linked yet");
        for (const id of [...parsed.sourceIds].sort((a, b) => a - b)) {
          option(String(id), "Reference [^cb" + id + "] (unverified)");
        }
        sourceSelect.value = [...parsed.sourceIds].some((id) => String(id) === previous) ? previous : "";
        count.textContent = String(items.length) + " / " + String(MAX_LOCAL_CLAIMS);
        try {
          addButton.disabled = !claimInput.value.trim() || items.length >= MAX_LOCAL_CLAIMS
            || !addLocalClaimReview(body.value, claimInput.value,
              sourceSelect.value ? Number(sourceSelect.value) : null);
        } catch { addButton.disabled = true; }
        if (!items.length) {
          const empty = document.createElement("li");
          empty.textContent = "No local claim-review notes added yet.";
          queue.append(empty);
        }
        for (const item of items) {
          const li = document.createElement("li");
          const description = document.createElement("span");
          description.textContent = "#" + item.id + " · " + item.state
            + " · " + (item.sourceId === null ? "No source attached"
              : item.sourceAvailable ? "Linked to [^cb" + item.sourceId + "] (not checked)"
                : "MISSING linked reference [^cb" + item.sourceId + "]")
            + " · " + item.claim;
          li.append(description);
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.textContent = item.state === LOCAL_CLAIM_PENDING
            ? "Record review note (not verified)" : "Return to needs review";
          toggle.addEventListener("click", () => {
            try {
              apply(markLocalClaimReview(body.value, item.id, item.state === LOCAL_CLAIM_PENDING));
              report("Local review status updated; accuracy and rights are NOT verified.");
            } catch { report("Could not update this local claim note."); }
          });
          const remove = document.createElement("button");
          remove.type = "button";
          remove.textContent = "Remove claim note " + item.id;
          remove.addEventListener("click", () => {
            try { apply(removeLocalClaimReview(body.value, item.id)); report("Local claim note removed."); }
            catch { report("Could not remove this local claim note."); }
          });
          li.append(toggle, remove);
          queue.append(li);
        }
      } catch {
        count.textContent = "Repair needed";
        addButton.disabled = true;
        const error = document.createElement("li");
        error.textContent = "Claim/source note formatting needs manual repair. Draft preserved.";
        queue.append(error);
      }
    };
    addButton.addEventListener("click", () => {
      try {
        const result = addLocalClaimReview(body.value, claimInput.value,
          sourceSelect.value ? Number(sourceSelect.value) : null);
        apply(result.value);
        claimInput.value = "";
        render();
        report("Review note saved inside this local article. Re-export Markdown to keep it.");
      } catch { report("Enter 10 to 220 text characters and select an existing source if needed."); }
    });
    body.addEventListener("input", render);
    claimInput.addEventListener("input", render);
    sourceSelect.addEventListener("change", render);
    if (preview && typeof MutationObserver !== "undefined") {
      new MutationObserver(render).observe(preview, { childList: true, characterData: true, subtree: true });
    }
    render();
  }
}
