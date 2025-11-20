import { PublicKey } from '@solana/web3.js';

export interface LookupTableEntry {
  address: string;
  index: number;
}

export interface LookupTableData {
  entries: LookupTableEntry[];
  authority?: string;
  deactivationSlot?: number;
  lastExtendedSlot?: number;
}

// Address Lookup Table Program ID
export const ADDRESS_LOOKUP_TABLE_PROGRAM_ID = new PublicKey('AddressLookupTab1e1111111111111111111111111');

// Helper function to check if an account is an address lookup table
export function isAddressLookupTableAccount(accountInfo: any): boolean {
  if (!accountInfo || !accountInfo.owner) {
    return false;
  }

  return accountInfo.owner.equals(ADDRESS_LOOKUP_TABLE_PROGRAM_ID);
}

// Helper function to check if a program ID is the address lookup table program
export function isAddressLookupTableProgram(programId: PublicKey): boolean {
  return programId.equals(ADDRESS_LOOKUP_TABLE_PROGRAM_ID);
}
