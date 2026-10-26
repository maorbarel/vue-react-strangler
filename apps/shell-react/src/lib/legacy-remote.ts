import type { MountModule } from "@strangler/contract";
import { createRemoteLoader } from "./remote-loader";

const DEV_REMOTE_URL = import.meta.env.VITE_LEGACY_REMOTE_URL ?? "http://localhost:8080/remoteEntry.js";

/**
 * Resolved against the app's base path, not document.baseURI: with browser
 * history, baseURI on /legacy/reports is /legacy/, which breaks relative URLs.
 */
const PROD_REMOTE_URL = new URL(`${import.meta.env.BASE_URL}remotes/legacy-vue/remoteEntry.js`, window.location.origin)
  .href;

const remoteUrl = import.meta.env.DEV ? DEV_REMOTE_URL : PROD_REMOTE_URL;

export const loadLegacyApp = createRemoteLoader<MountModule>({
  url: remoteUrl,
  globalName: "legacyVueApp",
  module: "./mount",
  preloadChunk: import.meta.env.DEV ? remoteUrl.replace(/[^/]+$/, "vendor.js") : undefined,
});
