/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Django backend API, e.g. http://127.0.0.1:8000 */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
