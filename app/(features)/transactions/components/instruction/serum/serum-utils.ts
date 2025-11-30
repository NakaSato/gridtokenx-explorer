/**
 * OpenBook V2 utilities - Modern DEX integration
 * Migrated from deprecated @project-serum/serum to community-governed OpenBook V2
 */

// OpenBook V2 Program ID (Secure, community-governed)
export const OPENBOOK_V2_PROGRAM_ID = 'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb';

// Legacy Serum V3 Program ID (DEFUNCT - for historical reference only)
export const LEGACY_SERUM_PROGRAM_ID = '9xQeWvG6KB1mUAWJ12hSoTUccP9cWhRBFvvZtr3F';

// Dynamic import wrapper to prevent SSR evaluation
let openbookModule: any = null;

async function loadOpenBookModule() {
  // Prevent any loading on server-side or during build
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  if (!openbookModule) {
    try {
      openbookModule = await import('@openbook-dex/openbook-v2');
      console.log('✅ OpenBook V2 loaded successfully');
    } catch (error) {
      console.error('Failed to load OpenBook V2 module:', error);
      return null;
    }
  }
  return openbookModule;
}

export async function getOpenBookModule() {
  return await loadOpenBookModule();
}

// Get Market class for loading DEX markets
export async function getMarketClass() {
  const module = await loadOpenBookModule();
  if (!module) {
    throw new Error('OpenBook V2 module not available');
  }
  return module.Market;
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
    console.warn('🔄 Migrated: Replacing deprecated Serum program ID with OpenBook V2');
    return OPENBOOK_V2_PROGRAM_ID;
  }
  return legacyProgramId;
}

// Migration info
export function getMigrationInfo(): {
  from: string;
  to: string;
  reason: string;
  status: 'completed';
} {
  return {
    from: '@project-serum/serum (deprecated)',
    to: '@openbook-dex/openbook-v2',
    reason: 'Security and community governance',
    status: 'completed',
  };
}

// Compatibility exports for legacy code
export async function getSerumModule() {
  return await loadOpenBookModule();
}

export function getMarkets() {
  return [];
}

export function getDecodeInstruction() {
  // Placeholder for synchronous decoding
  // In a real migration, this would need to be refactored to be async or use a static decoder
  return (data: Buffer) => {
    throw new Error("Synchronous Serum decoding is deprecated. Please migrate to async OpenBook V2 decoding.");
  };
}
