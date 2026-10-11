import { rm } from "node:fs/promises";
import { get } from "node:http";
import { setTimeout as delay } from "node:timers/promises";

function assertFixtureRunning(child) {
  if (child?.exitCode !== null && child?.exitCode !== undefined) {
    throw new Error(`Astro fixture exited early with code ${child.exitCode}`);
  }
  if (child?.signalCode) {
    throw new Error(`Astro fixture exited early with signal ${child.signalCode}`);
  }
}

export async function waitForFixtureReady({
  child,
  origin,
  probe = (url, options) => new Promise((resolve, reject) => {
    const request = get(url, options, (response) => {
      response.resume();
      resolve({ ok: response.statusCode >= 200 && response.statusCode < 400, status: response.statusCode });
    });
    request.once("error", reject);
  }),
  timeoutMs = 45_000,
  intervalMs = 250,
  now = Date.now,
  sleep = delay,
}) {
  const deadline = now() + timeoutMs;
  let lastError;

  while (now() < deadline) {
    assertFixtureRunning(child);
    const remainingMs = deadline - now();
    if (remainingMs <= 0) break;

    const controller = new AbortController();
    let abortTimer;
    let response;
    let probeError;
    const expired = new Promise((_, reject) => {
      abortTimer = setTimeout(() => {
        const error = new Error("readiness request exceeded the remaining deadline");
        controller.abort(error);
        reject(error);
      }, Math.max(1, Math.ceil(remainingMs)));
    });

    try {
      response = await Promise.race([
        Promise.resolve().then(() => probe(origin, { signal: controller.signal })),
        expired,
      ]);
    } catch (error) {
      probeError = error;
    } finally {
      clearTimeout(abortTimer);
    }

    assertFixtureRunning(child);
    if (response?.ok) return response;
    if (probeError) lastError = probeError;
    else if (response) lastError = new Error(`Fixture returned HTTP ${response.status}`);

    const remainingAfterProbe = deadline - now();
    if (remainingAfterProbe > 0) await sleep(Math.min(intervalMs, remainingAfterProbe));
  }

  throw new Error(`Astro fixture did not become ready: ${lastError?.message ?? "no response"}`);
}

export async function removeFixtureTempRootAfterExit(child, fixtureTempRoot, remove = rm) {
  if (child && child.exitCode === null && child.signalCode === null) return false;
  await remove(fixtureTempRoot, { recursive: true, force: true });
  return true;
}
