/**
 * RPC utilities for @solana/kit integration
 * Provides standardized RPC client creation and type conversion helpers
 */

import {
  createSolanaRpc,
  address as createAddress,
  Address,
  Commitment,
  signature as createSignature,
} from '@solana/kit';

/**
 * Type aliases compatible with @solana/web3.js
 * Maintains structural compatibility without requiring the import
 */
type PublicKeyLike = {
  toBase58(): string;
  equals(other: PublicKeyLike): boolean;
  toBuffer(): Buffer;
};

type LegacyCommitment = 'processed' | 'confirmed' | 'finalized' | 'recent' | 'single' | 'singleGossip' | 'root' | 'max';

type TransactionSignature = string;

type AccountInfo<T> = {
  executable: boolean;
  owner: PublicKeyLike;
  lamports: number;
  data: T;
  rentEpoch?: number;
};

type ConfirmedSignatureInfo = {
  signature: string;
  slot: number;
  err: any;
  memo: string | null;
  blockTime?: number | null;
  confirmationStatus?: 'processed' | 'confirmed' | 'finalized';
};

type ParsedTransactionWithMeta = {
  slot: number;
  transaction: any;
  meta: any;
  blockTime?: number | null;
  version?: any;
};

type VersionedBlockResponse = {
  blockhash: string;
  previousBlockhash: string;
  parentSlot: number;
  transactions: Array<{
    transaction: any;
    meta: any;
  }>;
  blockTime: number | null;
  blockHeight: number | null;
  rewards?: any[];
};

type ConnectionConfig = {
  commitment?: LegacyCommitment;
  wsEndpoint?: string;
  httpHeaders?: Record<string, string>;
  disableRetryOnRateLimit?: boolean;
  confirmTransactionInitialTimeout?: number;
};

// PublicKey class implementation for compatibility
class PublicKey implements PublicKeyLike {
  private _bn: Uint8Array;

  constructor(value: string | Buffer | Uint8Array | number[] | PublicKeyLike) {
    if (typeof value === 'string') {
      // Base58 decode
      const decoded = this.base58Decode(value);
      this._bn = decoded;
    } else if (value instanceof Uint8Array || value instanceof Buffer) {
      this._bn = new Uint8Array(value);
    } else if (Array.isArray(value)) {
      this._bn = new Uint8Array(value);
    } else if ('toBuffer' in value) {
      this._bn = value.toBuffer();
    } else {
      throw new Error('Invalid PublicKey input');
    }
  }

  toBase58(): string {
    return this.base58Encode(this._bn);
  }

  equals(other: PublicKeyLike): boolean {
    const otherBytes = other.toBuffer();
    if (this._bn.length !== otherBytes.length) return false;
    for (let i = 0; i < this._bn.length; i++) {
      if (this._bn[i] !== otherBytes[i]) return false;
    }
    return true;
  }

  toBuffer(): Buffer {
    return Buffer.from(this._bn);
  }

  private base58Encode(buffer: Uint8Array): string {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const base = BigInt(58);
    let num = 0n;
    for (const byte of buffer) {
      num = num * 256n + BigInt(byte);
    }
    
    let encoded = '';
    while (num > 0n) {
      const remainder = Number(num % base);
      num = num / base;
      encoded = ALPHABET[remainder] + encoded;
    }
    
    for (const byte of buffer) {
      if (byte === 0) encoded = '1' + encoded;
      else break;
    }
    
    return encoded;
  }

  private base58Decode(str: string): Uint8Array {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const base = BigInt(58);
    let num = 0n;
    
    for (const char of str) {
      const digit = ALPHABET.indexOf(char);
      if (digit < 0) throw new Error('Invalid base58 character');
      num = num * base + BigInt(digit);
    }
    
    const bytes: number[] = [];
    while (num > 0n) {
      bytes.unshift(Number(num % 256n));
      num = num / 256n;
    }
    
    for (const char of str) {
      if (char === '1') bytes.unshift(0);
      else break;
    }
    
    return new Uint8Array(bytes);
  }
}

// Connection class stub for legacy compatibility
class Connection {
  constructor(public endpoint: string, configOrCommitment?: LegacyCommitment | ConnectionConfig) {
    // Minimal implementation for compatibility
  }
}

/**
 * Create a Solana RPC client using @solana/kit
 * @param url RPC endpoint URL
 * @returns Configured RPC client
 */
export function createRpc(url: string) {
  return createSolanaRpc(url);
}

/**
 * Create an Address from a string or PublicKey
 * @param addressLike String address or PublicKey
 * @returns Address type from @solana/kit
 */
export function toAddress(addressLike: string | PublicKey): Address {
  const addressString = typeof addressLike === 'string' ? addressLike : addressLike.toBase58();
  return createAddress(addressString);
}

/**
 * Convert legacy PublicKey to new Address format
 * @param pubkey PublicKey from @solana/web3.js
 * @returns Address from @solana/kit
 */
export function publicKeyToAddress(pubkey: PublicKey): Address {
  return createAddress(pubkey.toBase58());
}

/**
 * Convert Address to legacy PublicKey
 * @param addr Address from @solana/kit
 * @returns PublicKey from @solana/web3.js
 */
export function addressToPublicKey(addr: Address): PublicKey {
  return new PublicKey(addr);
}

/**
 * Create a Signature from a transaction signature string
 * @param sig Transaction signature string
 * @returns Signature type from @solana/kit
 */
export function toSignature(sig: TransactionSignature | string) {
  return createSignature(sig);
}

/**
 * Convert bigint to number safely, throwing if value is too large
 * @param value bigint value
 * @returns number
 */
export function bigintToNumber(value: bigint): number {
  if (value > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Value ${value} exceeds MAX_SAFE_INTEGER`);
  }
  return Number(value);
}

/**
 * Create a legacy Connection instance for third-party library compatibility
 * Use this only when @solana/kit is not compatible with the library
 * @param url RPC endpoint URL
 * @param commitment Optional commitment level
 * @returns Connection instance
 */
export function createLegacyConnection(url: string, commitment?: LegacyCommitment): Connection {
  return new Connection(url, commitment);
}

/**
 * Map new kit commitment levels to legacy commitment levels
 */
export function toLegacyCommitment(commitment?: Commitment): LegacyCommitment | undefined {
  if (!commitment) return undefined;
  // Both use the same string values, so direct mapping works
  return commitment as LegacyCommitment;
}

/**
 * Convert @solana/kit Account response to legacy AccountInfo format
 * @param account Account from @solana/kit
 * @returns AccountInfo from @solana/web3.js
 */
export function toLegacyAccountInfo<T>(account: any): AccountInfo<T> {
  if (!account) return account;

  return {
    data: account.data,
    executable: account.executable,
    lamports: typeof account.lamports === 'bigint' ? bigintToNumber(account.lamports) : account.lamports,
    owner: account.owner ? addressToPublicKey(account.owner) : account.owner,
    rentEpoch: typeof account.rentEpoch === 'bigint' ? bigintToNumber(account.rentEpoch) : account.rentEpoch,
  } as AccountInfo<T>;
}

/**
 * Convert @solana/kit block response to legacy VersionedBlockResponse
 * Note: The structures are mostly compatible, but bigint values need conversion
 * @param block Block response from @solana/kit
 * @returns VersionedBlockResponse from @solana/web3.js
 */
export function toLegacyBlockResponse(block: any): VersionedBlockResponse {
  if (!block) return block;

  // The kit response structure is mostly compatible with legacy
  // Just need to handle bigint conversions where necessary
  return {
    ...block,
    blockTime: typeof block.blockTime === 'bigint' ? bigintToNumber(block.blockTime) : block.blockTime,
    blockHeight: typeof block.blockHeight === 'bigint' ? bigintToNumber(block.blockHeight) : block.blockHeight,
    parentSlot: typeof block.parentSlot === 'bigint' ? bigintToNumber(block.parentSlot) : block.parentSlot,
  } as VersionedBlockResponse;
}

/**
 * Convert @solana/kit transaction response to legacy ParsedTransactionWithMeta
 * @param tx Transaction from @solana/kit
 * @returns ParsedTransactionWithMeta from @solana/web3.js
 */
export function toLegacyParsedTransaction(tx: any): ParsedTransactionWithMeta | null {
  if (!tx) return tx;

  // Convert addresses in transaction to PublicKey instances
  const convertAddresses = (obj: any): any => {
    if (!obj) return obj;
    if (typeof obj === 'string') {
      // Check if it's a base58 address
      try {
        return new PublicKey(obj);
      } catch {
        return obj;
      }
    }
    if (Array.isArray(obj)) {
      return obj.map(convertAddresses);
    }
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        if (key === 'pubkey' || key === 'owner' || key === 'mint' || key === 'authority') {
          try {
            converted[key] = new PublicKey(obj[key]);
          } catch {
            converted[key] = obj[key];
          }
        } else {
          converted[key] = convertAddresses(obj[key]);
        }
      }
      return converted;
    }
    return obj;
  };

  return {
    ...tx,
    slot: typeof tx.slot === 'bigint' ? bigintToNumber(tx.slot) : tx.slot,
    blockTime: typeof tx.blockTime === 'bigint' ? bigintToNumber(tx.blockTime) : tx.blockTime,
    transaction: convertAddresses(tx.transaction),
    meta: tx.meta
      ? {
          ...tx.meta,
          fee: typeof tx.meta.fee === 'bigint' ? bigintToNumber(tx.meta.fee) : tx.meta.fee,
          preBalances: tx.meta.preBalances?.map((b: any) => (typeof b === 'bigint' ? bigintToNumber(b) : b)),
          postBalances: tx.meta.postBalances?.map((b: any) => (typeof b === 'bigint' ? bigintToNumber(b) : b)),
          preTokenBalances: convertAddresses(tx.meta.preTokenBalances),
          postTokenBalances: convertAddresses(tx.meta.postTokenBalances),
        }
      : tx.meta,
  } as ParsedTransactionWithMeta;
}

/**
 * Convert @solana/kit signature info to legacy ConfirmedSignatureInfo
 * @param sig Signature info from @solana/kit
 * @returns ConfirmedSignatureInfo from @solana/web3.js
 */
export function toLegacySignatureInfo(sig: any): ConfirmedSignatureInfo {
  if (!sig) return sig;

  return {
    signature: sig.signature,
    slot: typeof sig.slot === 'bigint' ? bigintToNumber(sig.slot) : sig.slot,
    err: sig.err,
    memo: sig.memo,
    blockTime: typeof sig.blockTime === 'bigint' ? bigintToNumber(sig.blockTime) : sig.blockTime,
    confirmationStatus: sig.confirmationStatus,
  } as ConfirmedSignatureInfo;
}
