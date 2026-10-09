import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CLOUDFLARE_PREVIEW_WORKER_NAME } from "./cloudflare-preview-policy.mjs";

export function validatePreviewOutput(result, expectedName) {
  const preview = result?.preview;
  const deployment = result?.deployment;
  if (!preview || !deployment || typeof preview !== "object" || typeof deployment !== "object") {
    throw new Error("Wrangler output does not contain nested Preview and deployment resources.");
  }

  if (typeof preview.id !== "string" || !preview.id || typeof deployment.id !== "string" || !deployment.id) {
    throw new Error("Wrangler must return Preview and deployment identities.");
  }
  if (preview.name !== expectedName || deployment.preview_name !== expectedName) {
    throw new Error("Wrangler returned a Preview name that does not match this workflow run.");
  }
  if (deployment.preview_id !== preview.id) {
    throw new Error("Wrangler returned a deployment that does not belong to the returned Preview.");
  }

  const previewUrl = validateCloudflareUrl(
    preview.urls,
    "stable Preview URL",
    `${expectedName}-${CLOUDFLARE_PREVIEW_WORKER_NAME}`,
  );
  const deploymentUrl = validateCloudflareUrl(
    deployment.urls,
    "immutable Deployment URL",
    `${deployment.id}-${CLOUDFLARE_PREVIEW_WORKER_NAME}`,
  );
  if (previewUrl === deploymentUrl) {
    throw new Error("Stable Preview and immutable Deployment URLs must be distinct.");
  }

  return { previewUrl, deploymentUrl };
}

function parseWranglerJsonOutput(output, expectedName) {
  try {
    return JSON.parse(output);
  } catch (parseError) {
    const lines = output.trim().split(/\r?\n/);
    const jsonStart = lines.findIndex((line) => line.trimStart().startsWith("{"));
    if (jsonStart !== 1 || !isExpectedPreviewProgressLine(lines[0], expectedName)) {
      const safeProgressLine = jsonStart === 1 ? redactProgressLine(lines[0]) : "";
      const diagnostic = safeProgressLine ? ` Received: ${safeProgressLine}` : "";
      throw new Error(`Wrangler output contains an unexpected Preview progress line.${diagnostic}`, { cause: parseError });
    }
    return JSON.parse(lines.slice(jsonStart).join("\n").trim());
  }
}

function isExpectedPreviewProgressLine(line, expectedName) {
  // Wrangler can colorize its single progress line even when stdout is redirected in hosted CI.
  // eslint-disable-next-line no-control-regex
  const normalizedLine = line.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "").trim();
  const previewIdentifier = `(?:${escapeRegExp(expectedName)}|["']${escapeRegExp(expectedName)}["'])`;
  const workerIdentifier = `(?:${escapeRegExp(CLOUDFLARE_PREVIEW_WORKER_NAME)}|["']${escapeRegExp(CLOUDFLARE_PREVIEW_WORKER_NAME)}["'])`;
  const progressPattern = new RegExp(
    String.raw`^(?:attaching|creating|updating|deploying)\s+preview\s+${previewIdentifier}\s+(?:to|on)\s+(?:worker\s+)?${workerIdentifier}[.!]?$`,
    "i",
  );
  return progressPattern.test(normalizedLine) && containsExactIdentifier(normalizedLine, expectedName) && containsExactIdentifier(normalizedLine, CLOUDFLARE_PREVIEW_WORKER_NAME);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, (character) => String.fromCharCode(92) + character);
}

function containsExactIdentifier(text, identifier) {
  let offset = -1;
  while ((offset = text.indexOf(identifier, offset + 1)) !== -1) {
    const before = text[offset - 1];
    const after = text[offset + identifier.length];
    if ((!before || !/[A-Za-z0-9_-]/.test(before)) && (!after || !/[A-Za-z0-9_-]/.test(after))) {
      return true;
    }
  }
  return false;
}

function redactProgressLine(line) {
  return redactCredentialAssignments(line.replace(/https?:\/\/\S+/gi, "[url]"))
    .replace(/\b[0-9a-f]{32}\b/gi, "[redacted]")
    .replace(/[A-Za-z0-9._~+/-]{24,}/g, "[redacted]")
    .replace(/[\r\n\t]/g, " ")
    .slice(0, 160);
}

function redactCredentialAssignments(line) {
  const parts = splitDiagnosticParts(line);
  let redactNextPart = false;

  return parts.map((part) => {
    if (/^\s+$/.test(part)) return part;
    if (redactNextPart) {
      if (part === "=" || part === ":") return part;
      redactNextPart = false;
      return "[redacted]";
    }

    const separatorIndex = part.search(/[=:]/);
    if (separatorIndex !== -1 && isCredentialKey(part.slice(0, separatorIndex))) {
      const valueStart = separatorIndex + 1;
      if (valueStart < part.length) return `${part.slice(0, valueStart)}[redacted]`;
      redactNextPart = true;
      return part;
    }

    if (isCredentialKey(part)) redactNextPart = true;
    return part;
  }).join("");
}

function isCredentialKey(value) {
  const key = value.toUpperCase().replace(/^-+/, "").replace(/^['"]|['"]$/g, "");
  return ["TOKEN", "SECRET", "KEY", "PASSWORD", "BEARER"].some((suffix) =>
    key === suffix || key.endsWith(`_${suffix}`) || key.endsWith(`-${suffix}`),
  );
}

function splitDiagnosticParts(value) {
  const parts = [];
  let partStart = 0;
  let activeQuote = "";
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    if (index < partStart) continue;
    const character = value[index];
    if (activeQuote) {
      ({ activeQuote, escaped } = advanceQuoteState(character, activeQuote, escaped));
      continue;
    }
    const previousCharacter = value[index - 1];
    if (
      (character === "\"" || character === "'")
      && (index === partStart || previousCharacter === "=" || previousCharacter === ":")
    ) {
      activeQuote = character;
      continue;
    }
    if (!/\s/.test(character)) continue;

    if (index > partStart) parts.push(value.slice(partStart, index));
    const whitespaceEnd = findWhitespaceEnd(value, index);
    parts.push(value.slice(index, whitespaceEnd));
    partStart = whitespaceEnd;
  }

  if (activeQuote) {
    parts.push("[redacted]");
    return parts;
  }

  if (partStart < value.length) parts.push(value.slice(partStart));
  return parts;
}

function advanceQuoteState(character, activeQuote, escaped) {
  if (escaped) return { activeQuote, escaped: false };
  if (character === "\\") return { activeQuote, escaped: true };
  return { activeQuote: character === activeQuote ? "" : activeQuote, escaped: false };
}

function findWhitespaceEnd(value, start) {
  let end = start;
  while (end < value.length && /\s/.test(value[end])) end += 1;
  return end;
}

export function parsePreviewOutput(output, expectedName) {
  return validatePreviewOutput(parseWranglerJsonOutput(output, expectedName), expectedName);
}

function advanceJsonScanState(state, character) {
  if (state.inString) {
    if (state.escaped) state.escaped = false;
    else if (character === "\\") state.escaped = true;
    else if (character === '"') state.inString = false;
    return;
  }

  switch (character) {
    case '"': state.inString = true; break;
    case "{": state.depth += 1; break;
    case "}": state.depth -= 1; break;
  }
}

function scanJsonObjectEnd(output, start) {
  const state = { depth: 0, inString: false, escaped: false };

  for (let offset = start; offset < output.length; offset += 1) {
    advanceJsonScanState(state, output[offset]);
    if (state.depth === 0) return offset + 1;
    if (state.depth < 0) throw new Error("Wrangler output event stream contains malformed JSON.");
  }

  throw new Error("Wrangler output event stream contains incomplete JSON.");
}

function parseJsonValueStream(output) {
  const values = [];
  let offset = 0;

  while (offset < output.length) {
    while (/\s/.test(output[offset] ?? "")) offset += 1;
    if (offset >= output.length) break;
    if (output[offset] !== "{") throw new Error("Wrangler output event stream contains data outside JSON objects.");

    const start = offset;
    offset = scanJsonObjectEnd(output, start);
    try {
      values.push(JSON.parse(output.slice(start, offset)));
    } catch (error) {
      throw new Error("Wrangler output event stream contains malformed JSON.", { cause: error });
    }
  }

  return values;
}

function validatePreviewOutputEvent(event, expectedName) {
  if (event.version !== 1 || event.type !== "preview") {
    throw new Error("Wrangler output event is not a supported Preview record.");
  }
  if (event.worker_name !== CLOUDFLARE_PREVIEW_WORKER_NAME) {
    throw new Error("Wrangler returned a Preview for a different Worker.");
  }
  if (event.preview_name !== expectedName) {
    throw new Error("Wrangler returned a Preview name that does not match this workflow run.");
  }
  if (
    typeof event.preview_id !== "string" || !event.preview_id ||
    typeof event.deployment_id !== "string" || !event.deployment_id
  ) {
    throw new Error("Wrangler must return Preview and deployment identities.");
  }

  const previewUrl = validateCloudflareUrl(
    event.preview_urls,
    "stable Preview URL",
    `${expectedName}-${CLOUDFLARE_PREVIEW_WORKER_NAME}`,
  );
  const deploymentUrl = validateCloudflareUrl(
    event.deployment_urls,
    "immutable Deployment URL",
    `${event.deployment_id}-${CLOUDFLARE_PREVIEW_WORKER_NAME}`,
  );
  if (previewUrl === deploymentUrl) {
    throw new Error("Stable Preview and immutable Deployment URLs must be distinct.");
  }
  return { previewUrl, deploymentUrl };
}

export function parsePreviewOutputEvents(output, expectedName) {
  const events = parseJsonValueStream(output);
  const sessionEvents = events.filter((event) => event?.type === "wrangler-session");
  const previewEvents = events.filter((event) => event?.type === "preview");
  const unsupportedEvents = events.filter((event) => !["wrangler-session", "preview"].includes(event?.type));

  if (events.length === 0) throw new Error("Wrangler did not write structured output events.");
  if (sessionEvents.length > 1 || sessionEvents.some((event) => event.version !== 1)) {
    throw new Error("Wrangler output contains an unsupported session event sequence.");
  }
  if (unsupportedEvents.length > 0) throw new Error("Wrangler output contains an unsupported event type.");
  if (previewEvents.length !== 1) throw new Error("Wrangler must return exactly one Preview output event.");

  return validatePreviewOutputEvent(previewEvents[0], expectedName);
}

function validateCloudflareUrl(values, label, expectedHostnameLabel) {
  if (!Array.isArray(values) || values.length !== 1) {
    throw new Error(`Wrangler must return exactly one ${label}.`);
  }
  const url = new URL(values[0]);
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".workers.dev") ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new Error(`${label} must be an HTTPS workers.dev origin without credentials, path, query, or fragment.`);
  }
  const hostnameLabel = url.hostname.split(".")[0];
  if (!hostnameLabel.endsWith(`-${CLOUDFLARE_PREVIEW_WORKER_NAME}`)) {
    throw new Error(`${label} must target the dedicated CoinBlink M00 Preview Worker.`);
  }
  if (hostnameLabel !== expectedHostnameLabel) {
    throw new Error(`${label} hostname does not match the returned Preview or deployment identity.`);
  }
  return url.origin;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [resultPath, expectedName] = process.argv.slice(2);
    const urls = parsePreviewOutputEvents(readFileSync(resultPath, "utf8"), expectedName);
    appendFileSync(process.env.GITHUB_OUTPUT, `stable_url=${urls.previewUrl}\ndeployment_url=${urls.deploymentUrl}\n`, "utf8");
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### CoinBlink M00 Worker Preview\n\n- Stable Preview: ${urls.previewUrl}\n- Immutable Deployment: ${urls.deploymentUrl}\n- Preview name: ${expectedName}\n- Build SHA: ${process.env.EXPECTED_SHA}\n`,
      "utf8",
    );
    console.log("Recorded the verified Wrangler Preview URLs and exact build SHA.");
  } catch (error) {
    console.error(`Worker Preview output rejected: ${error.message}`);
    process.exit(1);
  }
}
