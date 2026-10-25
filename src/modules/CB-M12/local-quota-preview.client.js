// Display-only, bounded arithmetic. No authentication, API usage or persistent state.
const root = document.querySelector("[data-m12-root]");
const preset = root?.querySelector("[data-m12-preset]");
const used = root?.querySelector("[data-m12-used]");
const remaining = root?.querySelector("[data-m12-remaining]");
const status = root?.querySelector("[data-m12-status]");
const reset = root?.querySelector("[data-m12-reset]");
const limits = Object.freeze({ sample: 5, prototype: 10, lab: 20 });
if (preset instanceof HTMLSelectElement && used instanceof HTMLInputElement &&
    remaining instanceof HTMLElement && status instanceof HTMLElement &&
    reset instanceof HTMLButtonElement) {
  const render = () => {
    const count = Number(used.value);
    const key = preset.value;
    const serverLimit = Number(preset.selectedOptions.item(0)?.dataset.m12Limit);
    if (!Object.hasOwn(limits, key) || serverLimit !== limits[key] ||
        used.value.trim() === "" || !Number.isSafeInteger(count) || count < 0 || count > 20) {
      remaining.textContent = "0";
      status.textContent = "SIMULATION ONLY · Invalid local amount. No API access granted.";
      return;
    }
    remaining.textContent = String(Math.max(0, limits[key] - count));
    status.textContent = count >= limits[key]
      ? "SIMULATION ONLY · Illustrative limit reached. No access is granted or billed."
      : "SIMULATION ONLY · Fictional allowance only. Nothing is saved, granted or billed.";
  };
  preset.addEventListener("change", render);
  used.addEventListener("input", render);
  reset.addEventListener("click", () => {
    preset.value = "sample";
    used.value = "0";
    render();
    preset.focus();
  });
}
