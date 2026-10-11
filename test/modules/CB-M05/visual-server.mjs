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

function childIsStillRunning(child) {
  return child.exitCode === null && child.signalCode === null;
}

export async function cleanupVisualFixture({ browser, server }) {
  try {
    await browser?.close();
  } finally {
    if (childIsStillRunning(server)) {
      server.kill("SIGTERM");
      const cleanupTimer = new AbortController();
      try {
        await Promise.race([
          new Promise((resolve) => server.once("exit", resolve)),
          delay(5000, undefined, { signal: cleanupTimer.signal }),
        ]);
      } finally {
        cleanupTimer.abort();
      }
      if (childIsStillRunning(server)) server.kill("SIGKILL");
    }
  }
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

async function runBoundedReadinessProbe({ probe, expectedOrigin, remainingMs }) {
  if (remainingMs <= 0) return { error: new Error("readiness probe exceeded the remaining deadline") };

  const controller = new AbortController();
  let timeout;
  const probeDeadline = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      const error = new Error("readiness probe exceeded the remaining deadline");
      controller.abort(error);
      reject(error);
    }, Math.max(1, Math.ceil(remainingMs)));
  });

  try {
    const response = await Promise.race([
      Promise.resolve().then(() => probe(new URL("/admin/articles", expectedOrigin), { signal: controller.signal })),
      probeDeadline,
    ]);
    return { response };
  } catch (error) {
    return { error };
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForReadinessRetry({ deadline, intervalMs, now, sleep }) {
  const remainingMs = deadline - now();
  if (remainingMs > 0) await sleep(Math.min(intervalMs, remainingMs));
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
    if (!childAnnouncedOrigin(getChildOutput(), expectedOrigin)) {
      await waitForReadinessRetry({ deadline, intervalMs, now, sleep });
      continue;
    }

    const result = await runBoundedReadinessProbe({ probe, expectedOrigin, remainingMs: deadline - now() });
    assertAstroChildRunning(child);
    if (result.response?.ok) return result.response;
    if (result.error) lastError = result.error;
    else if (result.response) lastError = new Error(`Fixture returned HTTP ${result.response.status}`);
    await waitForReadinessRetry({ deadline, intervalMs, now, sleep });
  }

  throw new Error(`Astro fixture did not become ready: ${lastError?.message ?? "no response"}`);
}
