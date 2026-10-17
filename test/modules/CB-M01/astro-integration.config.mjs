import { mergeConfig } from "astro/config";
import baseConfig from "../../../astro.config.mjs";

export default mergeConfig(baseConfig, { devToolbar: { enabled: false } });
