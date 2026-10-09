import { validatePreviewAuthorization } from "./cloudflare-preview-policy.mjs";

const errors = validatePreviewAuthorization(process.env);
if (errors.length > 0) {
  console.error(`Cloudflare Preview authorization is CLOSED: ${errors.join("; ")}.`);
  process.exit(1);
}

console.log("Cloudflare Preview authorization gate passed; secret values were not printed.");
