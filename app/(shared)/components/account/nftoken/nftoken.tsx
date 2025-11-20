import React from 'react';
import { PublicKey } from '@solana/web3.js';

export function NFToken() {
  return <div>NFToken - To be implemented</div>;
}

// NFToken Program ID (placeholder - would need actual program ID)
export const NFTOKEN_ADDRESS = new PublicKey('nftoken1111111111111111111111111111111111');

// Helper function to check if a program ID is NFToken
export function isNFTokenProgram(programId: PublicKey): boolean {
  return programId.equals(NFTOKEN_ADDRESS);
}
