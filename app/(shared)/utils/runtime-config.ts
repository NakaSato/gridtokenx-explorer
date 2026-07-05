/**
 * Runtime configuration lookup.
 *
 * NEXT_PUBLIC_* vars are inlined into the client chunks at image build time,
 * so changing an RPC URL or program ID meant rebuilding the whole explorer
 * image. Instead, the root layout injects `window.__RUNTIME_CONFIG__` from the
 * server's live environment on every request — a `docker compose up -d`
 * restart is enough to pick up new values.
 *
 * Lookup order:
 *   1. runtime injection (browser: window.__RUNTIME_CONFIG__; server: live
 *      process.env — the standalone server reads env at request time)
 *   2. the build-time NEXT_PUBLIC_ value passed by the caller (backward
 *      compatibility with images built the old way)
 *
 * The injected script is rendered before any chunk executes, so module-scope
 * `const X = runtimeConfig(...)` reads are safe.
 */

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: Record<string, string | undefined>;
  }
}

export function runtimeConfig(key: string, buildTimeFallback?: string): string | undefined {
  if (typeof window !== 'undefined') {
    return window.__RUNTIME_CONFIG__?.[key] ?? buildTimeFallback;
  }
  return process.env[key] ?? buildTimeFallback;
}

/** The exact set of keys the root layout injects — keep the two in sync. */
export const RUNTIME_CONFIG_KEYS = [
  'SOLANA_RPC_HTTP',
  'SOLANA_RPC_WS',
  'DEFAULT_CLUSTER',
  'TRADING_PROGRAM_ID',
  'TOKEN_PROGRAM_ID',
  'GOVERNANCE_PROGRAM_ID',
  'ORACLE_PROGRAM_ID',
  'REGISTRY_PROGRAM_ID',
  'TREASURY_PROGRAM_ID',
  'BLOCKBENCH_PROGRAM_ID',
] as const;
