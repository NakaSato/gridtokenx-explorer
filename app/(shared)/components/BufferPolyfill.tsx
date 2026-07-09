'use client';

// Webpack injected `Buffer`/`process` globals via ProvidePlugin. Turbopack
// (Next 16 default bundler) does not, so ~40 files that use bare `Buffer` /
// `process` globals at runtime would break in the browser. Set them once here.
// Runs in module scope when this client chunk evaluates — before any decoder
// (all runtime-called, post-mount) touches Buffer. Module-scope Buffer users
// (e.g. anchor.tsx) import `buffer` explicitly instead of relying on this.
import { Buffer } from 'buffer';
import process from 'process';

if (typeof globalThis !== 'undefined') {
  if (!globalThis.Buffer) globalThis.Buffer = Buffer;
  if (!globalThis.process) globalThis.process = process;
}

export function BufferPolyfill() {
  return null;
}
