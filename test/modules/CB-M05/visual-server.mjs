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

function assertAstroChildRunning(child) {
  if (child.exitCode !== null && child.exitCode !== undefined) {
    throw new Error(`Astro fixture exited early with code ${child.exitCode}`);
  }
  if (child.signalCode) {
    throw new Error(`Astro fixture exited early with signal ${child.signalCode}`);
  }
}

export async function waitForAstroServer({
  child,
  expectedOrigin,
  getChildOutput,
  getChildError = () => undefined,
  probe = (url, options) => fetch(url, options),
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
    assertAstroChildRunning(child);
    if (childAnnouncedOrigin(getChildOutput(), expectedOrigin)) {
      const remainingMs = deadline - now();
      if (remainingMs <= 0) break;
      const controller = new AbortController();
      let timeout;
      let response;
      let probeError;
      const probeDeadline = new Promise((_, reject) => {
        timeout = setTimeout(() => {
          const error = new Error("readiness probe exceeded the remaining deadline");
          controller.abort(error);
          reject(error);
        }, Math.max(1, Math.ceil(remainingMs)));
      });
      try {
        response = await Promise.race([
          Promise.resolve().then(() => probe(new URL("/admin/articles", expectedOrigin), { signal: controller.signal })),
          probeDeadline,
        ]);
      } catch (error) {
        probeError = error;
      } finally {
        clearTimeout(timeout);
      }
      assertAstroChildRunning(child);
      if (response?.ok) return response;
      if (probeError) lastError = probeError;
      else if (response) lastError = new Error(`Fixture returned HTTP ${response.status}`);
    }
    assertAstroChildRunning(child);
    const remainingMs = deadline - now();
    if (remainingMs > 0) await sleep(Math.min(intervalMs, remainingMs));
  }

  throw new Error(`Astro fixture did not become ready: ${lastError?.message ?? "no response"}`);
}
