/* global document */
import { createExplorerLookup } from "./explorer-links.js";

// Nothing is sent, logged, stored, fetched or opened until the visitor follows
// the explicitly generated outbound explorer link.
const form = document.querySelector("[data-explorer-form]");
if (form) {
  const network = form.querySelector("[data-explorer-network]");
  const kind = form.querySelector("[data-explorer-kind]");
  const input = form.querySelector("[data-explorer-value]");
  const status = form.querySelector("[data-explorer-status]");
  const result = form.querySelector("[data-explorer-result]");
  const link = form.querySelector("[data-explorer-link]");
  const provider = form.querySelector("[data-explorer-provider]");
  const isPt = form.getAttribute("data-locale") === "pt-br";

  const reset = () => {
    link.removeAttribute("href");
    result.hidden = true;
    status.textContent = "";
    input.removeAttribute("aria-invalid");
  };
  for (const field of [network, kind, input]) field.addEventListener("input", reset);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    reset();
    const lookup = createExplorerLookup(network.value, kind.value, input.value);
    if (!lookup.ok) {
      input.setAttribute("aria-invalid", "true");
      status.textContent = isPt
        ? "Formato inválido para a rede e o tipo escolhidos. Confira os caracteres."
        : "Invalid format for this network and type. Check the characters.";
      return;
    }
    link.setAttribute("href", lookup.url);
    provider.textContent = lookup.provider;
    result.hidden = false;
    status.textContent = isPt
      ? "Formato compatível. Isto não confirma existência, saldo, titularidade ou status na rede."
      : "Format looks compatible. This does not confirm existence, balance, ownership or network status.";
  });
}
