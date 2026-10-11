import { defineConfig } from "astro/config";

// This standalone fixture hosts only the M05 component for isolated browser checks.
// It is not part of the application router or deployment build.
export default defineConfig({
  output: "static",
  devToolbar: { enabled: false },
  vite: { server: { strictPort: true } },
});
