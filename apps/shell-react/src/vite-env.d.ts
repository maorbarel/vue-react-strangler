/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override the dev URL of the legacy remote entry (default http://localhost:8080/remoteEntry.js). */
  readonly VITE_LEGACY_REMOTE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
