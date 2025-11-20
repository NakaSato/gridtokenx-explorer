/**
 * GridTokenX Program IDs
 * 
 * These program IDs are loaded from environment variables (.env.local)
 * and can be used throughout the application to interact with GridTokenX programs.
 */

import { address, type Address } from '@solana/kit';

/**
 * Get GridTokenX program IDs from environment variables
 * These IDs should be configured in .env.local for local development
 */
export const GRIDTOKENX_PROGRAM_IDS = {
  registry: process.env.NEXT_PUBLIC_REGISTRY_PROGRAM_ID,
  oracle: process.env.NEXT_PUBLIC_ORACLE_PROGRAM_ID,
  governance: process.env.NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID,
  token: process.env.NEXT_PUBLIC_TOKEN_PROGRAM_ID,
  trading: process.env.NEXT_PUBLIC_TRADING_PROGRAM_ID,
} as const;

/**
 * Get program ID as Address type for use with @solana/kit
 * Returns undefined if the program ID is not configured
 */
export function getGridTokenXProgramAddress(
  program: keyof typeof GRIDTOKENX_PROGRAM_IDS
): Address | undefined {
  const programId = GRIDTOKENX_PROGRAM_IDS[program];
  if (!programId) {
    console.warn(`GridTokenX ${program} program ID not configured in environment variables`);
    return undefined;
  }
  return address(programId);
}

/**
 * Check if a program ID is configured
 */
export function isGridTokenXProgramConfigured(
  program: keyof typeof GRIDTOKENX_PROGRAM_IDS
): boolean {
  return Boolean(GRIDTOKENX_PROGRAM_IDS[program]);
}

/**
 * Get all configured GridTokenX program IDs as an array
 */
export function getAllConfiguredPrograms(): Array<{
  name: keyof typeof GRIDTOKENX_PROGRAM_IDS;
  id: string;
  address: Address;
}> {
  return (Object.keys(GRIDTOKENX_PROGRAM_IDS) as Array<keyof typeof GRIDTOKENX_PROGRAM_IDS>)
    .filter(key => GRIDTOKENX_PROGRAM_IDS[key])
    .map(key => ({
      name: key,
      id: GRIDTOKENX_PROGRAM_IDS[key]!,
      address: address(GRIDTOKENX_PROGRAM_IDS[key]!),
    }));
}

/**
 * Well-known Solana program IDs
 */
export const SOLANA_PROGRAM_IDS = {
  system: '11111111111111111111111111111111',
  token: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  token2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  associatedToken: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  metaplex: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  bpfLoader: 'BPFLoaderUpgradeab1e11111111111111111111111',
  bpfLoader1: 'BPFLoader1111111111111111111111111111111111',
  bpfLoader2: 'BPFLoader2111111111111111111111111111111111',
} as const;

/**
 * Get Solana system program address
 */
export function getSolanaProgramAddress(
  program: keyof typeof SOLANA_PROGRAM_IDS
): Address {
  return address(SOLANA_PROGRAM_IDS[program]);
}
