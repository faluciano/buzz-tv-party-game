/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RELAY_URL?: string;
  /** Base URL of the deployed controller, used to build the join link. */
  readonly VITE_CONTROLLER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
