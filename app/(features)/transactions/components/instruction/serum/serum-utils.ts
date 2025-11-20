/**
 * Client-only Serum utilities wrapper
 * This module wraps @project-serum/serum imports to prevent SSR issues
 */

// Dynamic import wrapper to prevent SSR evaluation
let serumModule: any = null;
let decodeInstruction: any = null;
let markets: any = null;

async function loadSerumModule() {
  if (typeof window === 'undefined') {
    // Return null on server-side
    return null;
  }

  if (!serumModule) {
    serumModule = await import('@project-serum/serum');
    decodeInstruction = serumModule.decodeInstruction;
    markets = serumModule.MARKETS;
  }
  return serumModule;
}

export async function getSerumModule() {
  return await loadSerumModule();
}

// Synchronous access (assumes module is already loaded or we're on client)
export function getDecodeInstruction() {
  if (typeof window === 'undefined') {
    throw new Error('Serum decodeInstruction can only be used on the client');
  }

  if (!decodeInstruction) {
    throw new Error('Serum module not loaded. Call getSerumModule() first.');
  }

  return decodeInstruction;
}

export function getMarkets() {
  if (typeof window === 'undefined') {
    return [];
  }

  if (!markets) {
    throw new Error('Serum module not loaded. Call getSerumModule() first.');
  }

  return markets;
}
