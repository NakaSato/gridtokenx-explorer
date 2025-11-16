/**
 * Client-only Serum utilities wrapper
 * This module wraps @project-serum/serum imports to prevent SSR issues
 */

// Dynamic import wrapper to prevent SSR evaluation
let serumModule: any = null;

export async function getSerumModule() {
    if (typeof window === 'undefined') {
        // Return null on server-side
        return null;
    }
    
    if (!serumModule) {
        serumModule = await import('@project-serum/serum');
    }
    return serumModule;
}

// Synchronous access (assumes module is already loaded or we're on client)
export function getDecodeInstruction() {
    if (typeof window === 'undefined') {
        throw new Error('Serum decodeInstruction can only be used on the client');
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@project-serum/serum').decodeInstruction;
}

export function getMarkets() {
    if (typeof window === 'undefined') {
        return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@project-serum/serum').MARKETS;
}
