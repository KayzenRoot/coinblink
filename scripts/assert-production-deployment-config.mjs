import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import {
  CLOUDFLARE_ACCOUNT_ID,
  COINBLINK_REPOSITORY,
  PRODUCTION_WORKER_NAME,
  PRODUCTION_WORKER_URL,
  validateProductionTarget,
} from "./cloudflare-production-policy.mjs";

export function validateProductionDeploymentEnvironment(env = process.env) {
  const errors = validateProductionTarget({
    repository: env.GITHUB_REPOSITORY,
    workerName: env.COINBLINK_CF_WORKER_NAME,
    workerUrl: env.COINBLINK_CF_WORKER_URL,
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
  });
  if (env.GITHUB_REF !== "refs/heads/main") errors.push("GitHub environment ref must be main");
  if (env.GITHUB_ENVIRONMENT !== "production") errors.push("GitHub environment must be production");
  if (!/^[0-9a-f]{40}$/.test(env.EXPECTED_MAIN_SHA ?? "")) errors.push("eligible main SHA is missing");
  if (typeof env.CLOUDFLARE_API_TOKEN !== "string" || env.CLOUDFLARE_API_TOKEN.length < 20) {
    errors.push("production Cloudflare API token is not configured");
  }
  return errors;
}

export function assertProductionDeploymentEnvironment(env = process.env, logger = console) {
  const errors = validateProductionDeploymentEnvironment(env);
  if (errors.length > 0) {
    logger.error(`Production configuration blocked: ${errors.join("; ")}`);
    return 1;
  }
  logger.log(`Verified production target ${PRODUCTION_WORKER_NAME} at ${PRODUCTION_WORKER_URL} for ${COINBLINK_REPOSITORY}.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = assertProductionDeploymentEnvironment();
}

export { CLOUDFLARE_ACCOUNT_ID, COINBLINK_REPOSITORY, PRODUCTION_WORKER_NAME, PRODUCTION_WORKER_URL };
