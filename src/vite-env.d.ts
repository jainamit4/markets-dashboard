/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin (or origin + /api/yahoo) of a deployed Yahoo CORS proxy. */
  readonly VITE_YAHOO_PROXY_BASE?: string;
}
