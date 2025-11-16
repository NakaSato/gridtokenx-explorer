/**
 * RPC utilities for @solana/kit integration
 * Provides standardized RPC client creation and type conversion helpers
 */

import { createSolanaRpc, address as createAddress, Address, Commitment, signature as createSignature } from '@solana/kit';
import {
    Connection,
    PublicKey,
    Commitment as LegacyCommitment,
    VersionedBlockResponse,
    ParsedTransactionWithMeta,
    ConfirmedSignatureInfo,
    AccountInfo,
    TransactionSignature,
} from '@solana/web3.js';

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
        meta: tx.meta ? {
            ...tx.meta,
            fee: typeof tx.meta.fee === 'bigint' ? bigintToNumber(tx.meta.fee) : tx.meta.fee,
            preBalances: tx.meta.preBalances?.map((b: any) => 
                typeof b === 'bigint' ? bigintToNumber(b) : b
            ),
            postBalances: tx.meta.postBalances?.map((b: any) => 
                typeof b === 'bigint' ? bigintToNumber(b) : b
            ),
            preTokenBalances: convertAddresses(tx.meta.preTokenBalances),
            postTokenBalances: convertAddresses(tx.meta.postTokenBalances),
        } : tx.meta,
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
