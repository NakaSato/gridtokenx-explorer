/**
 * Serum utilities wrapper with security enhancements
 * This module provides safe access to @project-serum/serum with security warnings
 */

// OpenBook V2 Program ID (Secure, community-governed)
export const OPENBOOK_V2_PROGRAM_ID = 'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb';

// Legacy Serum V3 Program ID (DEFUNCT - Security Risk)
export const LEGACY_SERUM_PROGRAM_ID = '9xQeW6G6KB1mUAWJ12hSoTUccP9cWhRBFvvZtr3F';

// Dynamic import wrapper to prevent SSR evaluation
let serumModule: any = null;
let decodeInstruction: any = null;
let markets: any = null;

async function loadSerumModule() {
  // Prevent any loading on server-side or during build
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (!serumModule) {
    try {
      serumModule = await import('@project-serum/serum');
      decodeInstruction = serumModule.decodeInstruction;
      markets = serumModule.MARKETS;

      // Log security warning about legacy Serum usage
      console.warn('⚠️  SECURITY WARNING: Using deprecated @project-serum/serum package.');
      console.warn('⚠️  This package uses a defunct program ID controlled by FTX.');
      console.warn('⚠️  Consider migrating to OpenBook V2 for security.');
      console.warn('📚 Migration guide: https://github.com/openbook-dex/openbook-v2');
    } catch (error) {
      console.error('Failed to load Serum module:', error);
      return null;
    }
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

// Security validation functions
export function isLegacySerumProgram(programId: string): boolean {
  return programId === LEGACY_SERUM_PROGRAM_ID;
}

export function isOpenBookV2Program(programId: string): boolean {
  return programId === OPENBOOK_V2_PROGRAM_ID;
}

export function getSecureProgramId(legacyProgramId: string): string {
  if (isLegacySerumProgram(legacyProgramId)) {
    console.warn('🚨 SECURITY: Replacing deprecated Serum program ID with secure OpenBook V2 program ID');
    return OPENBOOK_V2_PROGRAM_ID;
  }
  return legacyProgramId;
}

// Migration helper
export function getMigrationRecommendation(): {
  recommended: string;
  reason: string;
  urgency: 'high' | 'medium' | 'low';
} {
  return {
    recommended: 'OpenBook V2',
    reason: 'Serum V3 program keys were compromised in FTX collapse, creating systemic security risk',
    urgency: 'high',
  };
}
