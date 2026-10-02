/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_AI_PIPELINE_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

