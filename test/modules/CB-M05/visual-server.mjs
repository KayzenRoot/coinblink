import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "node:net";

export async function allocateEphemeralPort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Native socket did not return a TCP port");
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

export function buildAstroDevArgs(astroCli, port) {
  return [astroCli, "dev", "--host", "127.0.0.1", "--port", String(port), "--strictPort"];
}

function stripTerminalEscapes(output) {
  let normalized = "";
  for (let index = 0; index < output.length; index += 1) {
    if (output.charCodeAt(index) === 0x1b && output[index + 1] === "[") {
      index += 2;
      while (index < output.length) {
        const code = output.charCodeAt(index);
        if (code >= 0x40 && code <= 0x7e) break;
        index += 1;
      }
      continue;
    }
    normalized += output[index];
  }
  return normalized;
}

export function childAnnouncedOrigin(output, expectedOrigin) {
  const normalizedOutput = stripTerminalEscapes(output);
  const expected = new URL(expectedOrigin).origin;

  return normalizedOutput.split(/\r?\n/u).some((line) => {
    const localUrl = line.match(/\bLocal\s+(https?:\/\/\S+)/iu)?.[1];
    if (!localUrl) return false;
    try {
      return new URL(localUrl).origin === expected;
    } catch {
      return false;
    }
  });
}

export async function waitForAstroServer({
  child,
  expectedOrigin,
  getChildOutput,
  getChildError = () => undefined,
  probe = (url) => fetch(url),
  timeoutMs = 90_000,
  intervalMs = 500,
  now = Date.now,
  sleep = delay,
}) {
  const deadline = now() + timeoutMs;
  let lastError;

  while (now() < deadline) {
    const childError = getChildError();
    if (childError) throw new Error(`Astro fixture could not start: ${childError.message}`);
    if (child.exitCode !== null) throw new Error(`Astro fixture exited early with code ${child.exitCode}`);
    if (childAnnouncedOrigin(getChildOutput(), expectedOrigin)) {
      try {
        const response = await probe(new URL("/admin/articles", expectedOrigin));
        if (response.ok) return response;
        lastError = new Error(`Fixture returned HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
      }
    }
    await sleep(intervalMs);
  }

  throw new Error(`Astro fixture did not become ready: ${lastError?.message ?? "no response"}`);
}
