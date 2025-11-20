/**
 * Transaction utilities
 * 
 * Uses structurally compatible type aliases instead of importing from @solana/web3.js.
 * These types match the web3.js v1 interfaces, allowing seamless compatibility with
 * the rest of the codebase through TypeScript's structural typing.
 */
import { Cluster } from '@/app/(shared)/utils/cluster';
import { SerumMarketRegistry } from '@/app/(shared)/utils/serumMarketRegistry';
import bs58 from 'bs58';

import { LOADER_IDS, PROGRAM_INFO_BY_ID, SPECIAL_IDS, SYSVAR_IDS } from './programs';

/**
 * Type aliases compatible with @solana/web3.js types
 * These maintain structural compatibility without requiring the import
 */
type PublicKeyLike = {
  toBase58(): string;
  equals(other: PublicKeyLike): boolean;
};

type AccountMetaLike = {
  pubkey: PublicKeyLike;
  isSigner: boolean;
  isWritable: boolean;
};

export type ParsedInstruction = {
  programId: PublicKeyLike;
  parsed: unknown;
  program?: string;
};

export type PartiallyDecodedInstruction = {
  programId: PublicKeyLike;
  accounts: PublicKeyLike[];
  data: string;
};

export type TransactionInstruction = {
  programId: PublicKeyLike;
  keys: AccountMetaLike[];
  data: Buffer | Uint8Array;
};

export type ParsedTransaction = {
  message: {
    accountKeys: Array<{
      pubkey: PublicKeyLike;
      signer: boolean;
      writable: boolean;
      source?: string;
    }>;
    instructions: any[];
    recentBlockhash?: string;
    addressTableLookups?: any[];
  };
  signatures: string[];
};

export type Transaction = {
  signatures: Array<{ publicKey: PublicKeyLike; signature: Uint8Array | null }>;
  compileMessage(): {
    accountKeys: PublicKeyLike[];
    instructions: Array<{
      programIdIndex: number;
      accounts: number[];
      data: Buffer;
    }>;
    recentBlockhash: string;
    isAccountWritable(index: number): boolean;
  };
};

export type TokenLabelInfo = {
  name?: string;
  symbol?: string;
};

export function getProgramName(address: string, cluster: Cluster): string {
  const label = programLabel(address, cluster);
  if (label) return label;
  return `Unknown Program (${address})`;
}

export function programLabel(address: string, cluster: Cluster): string | undefined {
  const programInfo = PROGRAM_INFO_BY_ID[address];
  if (programInfo && programInfo.deployments.includes(cluster)) {
    return programInfo.name;
  }

  return LOADER_IDS[address] as string;
}

function tokenLabel_(tokenInfo?: TokenLabelInfo): string | undefined {
  if (!tokenInfo || !tokenInfo.name || !tokenInfo.symbol) return;
  if (tokenInfo.name === tokenInfo.symbol) {
    return tokenInfo.name;
  }
  return `${tokenInfo.symbol} - ${tokenInfo.name}`;
}

export function addressLabel(address: string, cluster: Cluster, tokenInfo?: TokenLabelInfo): string | undefined {
  return (
    programLabel(address, cluster) ||
    SYSVAR_IDS[address] ||
    SPECIAL_IDS[address] ||
    tokenLabel_(tokenInfo) ||
    SerumMarketRegistry.get(address, cluster)
  );
}

export function displayAddress(address: string, cluster: Cluster, tokenInfo?: TokenLabelInfo): string {
  return addressLabel(address, cluster, tokenInfo) || address;
}

export function intoTransactionInstruction(
  tx: ParsedTransaction,
  instruction: ParsedInstruction | PartiallyDecodedInstruction,
): TransactionInstruction | undefined {
  const message = tx.message;
  if ('parsed' in instruction) return;

  const keys: AccountMetaLike[] = [];
  for (const account of instruction.accounts) {
    const accountKey = message.accountKeys.find(({ pubkey }) => pubkey.equals(account));
    if (!accountKey) return;
    keys.push({
      isSigner: accountKey.signer,
      isWritable: accountKey.writable,
      pubkey: accountKey.pubkey,
    });
  }

  return {
    data: Buffer.from(bs58.decode(instruction.data)),
    keys: keys,
    programId: instruction.programId,
  };
}

export function intoParsedTransaction(tx: Transaction): ParsedTransaction {
  const message = tx.compileMessage();
  return {
    message: {
      accountKeys: message.accountKeys.map((key, index) => ({
        pubkey: key,
        signer: tx.signatures.some(({ publicKey }) => publicKey.equals(key)),
        writable: message.isAccountWritable(index),
      })),
      instructions: message.instructions.map(ix => ({
        accounts: ix.accounts.map(index => message.accountKeys[index]),
        data: ix.data,
        programId: message.accountKeys[ix.programIdIndex],
      })),
      recentBlockhash: message.recentBlockhash,
    },
    signatures: tx.signatures.map(value => bs58.encode(value.signature as any)),
  };
}
