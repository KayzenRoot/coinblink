const configuredSha = import.meta.env.PUBLIC_BUILD_SHA?.trim();
const configuredEnvironment = import.meta.env.PUBLIC_BUILD_ENV?.trim();

export const buildInfo = Object.freeze({
  sha: configuredSha || "local",
  environment: configuredEnvironment || "local",
});
