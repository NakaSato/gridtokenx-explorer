// Empty stub. Turbopack aliases node builtins (fs/os/path/crypto/stream/util)
// to this for the browser condition — mirrors the webpack `resolve.fallback:
// { fs: false, ... }` in next.config.mjs. These builtins are only reached by
// node-only code paths in deps (e.g. @coral-xyz/anchor env/wallet helpers)
// that never execute in the browser.
export default {};
