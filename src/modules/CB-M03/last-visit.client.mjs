/* global document, window */
// CB-M03-P1-LAST-VISIT-001: progressive enhancement for returning readers.
import { LIVE_LAST_VISIT_KEY, isNewSince, parseLastVisit } from "./last-visit.mjs";

const LIST = "[data-m03-live-list]";
const ITEM = "[data-m03-live-item]";
const STATUS = "[data-m03-new-status]";

function badge(label) {
  const span = document.createElement("span");
  span.className = "m03-live__new";
  span.textContent = label;
  return span;
}

function start() {
  const list = document.querySelector(LIST);
  if (list === null) return;
  const previous = (() => {
    try {
      return parseLastVisit(window.localStorage.getItem(LIVE_LAST_VISIT_KEY));
    } catch {
      return null;
    }
  })();
  const label = list.getAttribute("data-m03-new-label") ?? "";
  let count = 0;
  if (previous !== null) {
    for (const item of document.querySelectorAll(ITEM)) {
      const time = item.querySelector("time[datetime]");
      if (time === null || !isNewSince(time.getAttribute("datetime"), previous)) continue;
      item.setAttribute("data-m03-new", "true");
      const headline = item.querySelector("h3");
      if (headline !== null && label !== "") headline.append(" ", badge(label));
      count += 1;
    }
  }
  const status = document.querySelector(STATUS);
  if (status !== null) {
    const template = status.getAttribute("data-m03-new-template") ?? "";
    if (count > 0 && template !== "") {
      status.textContent = template.replace("{count}", String(count));
      status.hidden = false;
    }
  }
  try {
    window.localStorage.setItem(LIVE_LAST_VISIT_KEY, new Date().toISOString());
  } catch {
    // Storage denied: markers stay off and the visit is not recorded.
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
