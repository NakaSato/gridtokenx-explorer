import { PublicKey } from '@solana/web3.js';
import {
  OPENBOOK_V2_PROGRAM_ID,
  getSerumModule,
  isLegacySerumProgram,
  isOpenBookV2Program,
} from '../serum/serum-utils';

export type MangoInstructionType =
  | 'initMangoGroup'
  | 'initMangoAccount'
  | 'deposit'
  | 'withdraw'
  | 'addPerpMarket'
  | 'addSpotMarket'
  | 'addOracle'
  | 'setOracle'
  | 'updatePerpMarket'
  | 'updateSpotMarket'
  | 'setMangoGroupAdmin'
  | 'setMangoGroupPermissions'
  | 'setGroupFees'
  | 'forceCancelOrders'
  | 'setCurveParameters'
  | 'settleFees'
  | 'settlePnl'
  | 'liquidate'
  | 'resolvePerpBankruptcy'
  | 'resolveTokenBankruptcy'
  | 'updateRootBank'
  | 'updateMangoAccount'
  | 'placeOrder'
  | 'placePerpOrder'
  | 'placePerpOrder2'
  | 'modifyOrder'
  | 'modifyPerpOrder'
  | 'modifyPerpOrder2'
  | 'cancelOrder'
  | 'cancelPerpOrder'
  | 'cancelAllOrders'
  | 'cancelAllPerpOrders'
  | 'addToBasket'
  | 'removeFromBasket'
  | 'setReferrer'
  | 'claimReferrerRewards'
  | 'cacheRefresh'
  | 'cacheRootBank'
  | 'cachePerpMarket'
  | 'cacheRefreshForOwner'
  | 'updateIndex'
  | 'cacheIndex'
  | 'cacheEventQueue'
  | 'serum3PlaceOrder'
  | 'serum3CancelOrder'
  | 'serum3SettleFunds'
  | 'serum3CancelAllOrders'
  | 'serum3SettleDexFunds'
  | 'serum3AddToBasket'
  | 'serum3RemoveFromBasket'
  | 'serum3RecoverTokens';

export type SerumInstructionType =
  | 'initializeMarket'
  | 'newOrderV3'
  | 'matchOrdersV3'
  | 'consumeEventsV3'
  | 'cancelOrderV3'
  | 'settleFundsV3'
  | 'srmWithdrawV2'
  | 'srmWithdrawV3'
  | 'newOrderV2'
  | 'matchOrdersV2'
  | 'consumeEventsV2'
  | 'cancelOrderV2'
  | 'settleFundsV2';

export const MANGO_PROGRAM_ID = new PublicKey('3wE1DTnvoXEjo3hSD1HFNYiBQBjMZf6ymZEbD1Q9dB8');

// Legacy Serum V3 Program ID (DEFUNCT - Security Risk)
export const LEGACY_SERUM_PROGRAM_ID = new PublicKey('9xQeW6G6KB1mUAWJ12hSoTUccP9cWhRBFvvZtr3F');

export async function decodeSerumInstruction(instruction: any): Promise<any> {
  try {
    // Check if this is a legacy Serum program - if so, warn and return null
    if (instruction.programId && isLegacySerumProgram(instruction.programId.toString())) {
      console.warn(
        '🚨 SECURITY ALERT: Attempted to decode instruction from deprecated Serum program. This is a security risk.',
      );
      return null;
    }

    // Check if this is new OpenBook V2 program
    if (instruction.programId && !isOpenBookV2Program(instruction.programId.toString())) {
      return null; // Not a Serum/OpenBook instruction
    }

    // Load Serum module dynamically for client-side decoding
    const serumModule = await getSerumModule();
    if (!serumModule) {
      throw new Error('Serum module not available on client');
    }

    // Use Serum's decode instruction function
    if (serumModule.decodeInstruction) {
      return serumModule.decodeInstruction(instruction);
    }

    // Fallback: Basic instruction parsing
    return {
      type: 'unknown',
      programId: instruction.programId?.toString(),
      data: instruction.data,
      accounts: instruction.accounts,
    };
  } catch (error) {
    console.error('Failed to decode Serum/OpenBook instruction:', error);
    return null;
  }
}

// Helper function to check if a program ID is Mango
export function isMangoProgram(programId: PublicKey): boolean {
  return programId.equals(MANGO_PROGRAM_ID);
}

// Helper function to check if a program ID is legacy Serum (for security warnings)
export function isLegacySerumProgramPk(programId: PublicKey): boolean {
  return programId.equals(LEGACY_SERUM_PROGRAM_ID);
}

// Helper function to check if a program ID is OpenBook V2
export function isOpenBookV2ProgramPk(programId: PublicKey): boolean {
  const openbookId = new PublicKey(OPENBOOK_V2_PROGRAM_ID);
  return programId.equals(openbookId);
}

// Migration helper for updating old program references
export function getSecureProgramId(legacyProgramId: PublicKey): PublicKey {
  if (isLegacySerumProgramPk(legacyProgramId)) {
    console.warn('🚨 SECURITY: Replacing deprecated Serum program ID with secure OpenBook V2 program ID');
    return new PublicKey(OPENBOOK_V2_PROGRAM_ID);
  }
  return legacyProgramId;
}

// Additional exports needed by the application
export function isMangoInstruction(programId: PublicKey): boolean {
  return isMangoProgram(programId);
}

export function parseMangoInstructionTitle(instruction: any): string {
  // Placeholder implementation - would need actual Mango instruction parsing logic
  return 'Mango Instruction';
}

// Placeholder implementations for missing decode functions
export function decodePlaceSpotOrder(instruction: any): any {
  return { type: 'placeSpotOrder', data: instruction.data };
}

export function decodeCancelSpotOrder(instruction: any): any {
  return { type: 'cancelSpotOrder', data: instruction.data };
}

export function decodeAddPerpMarket(instruction: any): any {
  return { type: 'addPerpMarket', data: instruction.data };
}

export function decodePlacePerpOrder(instruction: any): any {
  return { type: 'placePerpOrder', data: instruction.data };
}

export function decodePlacePerpOrder2(instruction: any): any {
  return { type: 'placePerpOrder2', data: instruction.data };
}

export function decodeCancelPerpOrder(instruction: any): any {
  return { type: 'cancelPerpOrder', data: instruction.data };
}

export function decodeChangePerpMarketParams(instruction: any): any {
  return { type: 'changePerpMarketParams', data: instruction.data };
}

export function decodeAddSpotMarket(instruction: any): any {
  return { type: 'addSpotMarket', data: instruction.data };
}

// Placeholder functions for market helpers
export function spotMarketFromIndex(index: number): any {
  return { marketIndex: index };
}

export function getPerpMarketFromInstruction(instruction: any): any {
  return { market: 'perp-market-placeholder' };
}

export function getSpotMarketFromInstruction(instruction: any): any {
  return { market: 'spot-market-placeholder' };
}

export function getPerpMarketFromPerpMarketConfig(config: any): any {
  return { market: config };
}

export function getSpotMarketFromSpotMarketConfig(config: any): any {
  return { market: config };
}
