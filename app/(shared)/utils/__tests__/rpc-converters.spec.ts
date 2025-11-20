import { describe, expect, it } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { address } from '@solana/kit';
import {
  toAddress,
  publicKeyToAddress,
  addressToPublicKey,
  bigintToNumber,
  toLegacyAccountInfo,
  toLegacyBlockResponse,
  toLegacyParsedTransaction,
  toLegacySignatureInfo,
} from '../rpc';

describe('RPC Type Converters', () => {
  const testAddressString = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  const testPubkey = new PublicKey(testAddressString);
  const testAddress = address(testAddressString);

  describe('toAddress', () => {
    it('should convert string to Address', () => {
      const result = toAddress(testAddressString);
      expect(result).toBe(testAddressString);
    });

    it('should convert PublicKey to Address', () => {
      const result = toAddress(testPubkey);
      expect(result).toBe(testAddressString);
    });
  });

  describe('publicKeyToAddress', () => {
    it('should convert PublicKey to Address', () => {
      const result = publicKeyToAddress(testPubkey);
      expect(result).toBe(testAddressString);
    });
  });

  describe('addressToPublicKey', () => {
    it('should convert Address to PublicKey', () => {
      const result = addressToPublicKey(testAddress);
      expect(result.toBase58()).toBe(testAddressString);
    });
  });

  describe('bigintToNumber', () => {
    it('should convert small bigint to number', () => {
      expect(bigintToNumber(100n)).toBe(100);
      expect(bigintToNumber(0n)).toBe(0);
      expect(bigintToNumber(999999n)).toBe(999999);
    });

    it('should convert bigint within safe integer range', () => {
      const safeInt = BigInt(Number.MAX_SAFE_INTEGER);
      expect(bigintToNumber(safeInt)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should throw error for bigint exceeding safe integer range', () => {
      const unsafeInt = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
      expect(() => bigintToNumber(unsafeInt)).toThrow();
    });
  });

  describe('toLegacyAccountInfo', () => {
    it('should convert kit account to legacy AccountInfo', () => {
      const kitAccount = {
        data: Buffer.from('test'),
        executable: false,
        lamports: 1000000n,
        owner: testAddress,
        rentEpoch: 100n,
      };

      const result = toLegacyAccountInfo(kitAccount);
      expect(result.data).toEqual(Buffer.from('test'));
      expect(result.executable).toBe(false);
      expect(result.lamports).toBe(1000000);
      expect(result.owner.toBase58()).toBe(testAddressString);
      expect(result.rentEpoch).toBe(100);
    });

    it('should handle null account', () => {
      expect(toLegacyAccountInfo(null)).toBeNull();
      expect(toLegacyAccountInfo(undefined)).toBeUndefined();
    });

    it('should handle account with number values (already legacy)', () => {
      const legacyAccount = {
        data: Buffer.from('test'),
        executable: true,
        lamports: 1000000,
        owner: testPubkey,
        rentEpoch: 100,
      };

      const result = toLegacyAccountInfo(legacyAccount);
      expect(result.lamports).toBe(1000000);
      expect(result.rentEpoch).toBe(100);
    });
  });

  describe('toLegacyBlockResponse', () => {
    it('should convert kit block to legacy VersionedBlockResponse', () => {
      const kitBlock = {
        blockTime: 1699999999n,
        blockHeight: 200000000n,
        parentSlot: 199999999n,
        blockhash: 'test-blockhash',
        previousBlockhash: 'test-previous',
        transactions: [],
      };

      const result = toLegacyBlockResponse(kitBlock);
      expect(result.blockTime).toBe(1699999999);
      expect(result.blockHeight).toBe(200000000);
      expect(result.parentSlot).toBe(199999999);
      expect(result.blockhash).toBe('test-blockhash');
    });

    it('should handle null block', () => {
      expect(toLegacyBlockResponse(null)).toBeNull();
    });

    it('should preserve other block properties', () => {
      const kitBlock = {
        blockTime: 1699999999n,
        blockHeight: 200000000n,
        parentSlot: 199999999n,
        blockhash: 'test-blockhash',
        previousBlockhash: 'test-previous',
        transactions: [{ test: 'transaction' }],
        rewards: [],
      };

      const result = toLegacyBlockResponse(kitBlock);
      expect(result.transactions).toEqual([{ test: 'transaction' }]);
      expect(result.rewards).toEqual([]);
    });
  });

  describe('toLegacyParsedTransaction', () => {
    it('should convert kit transaction to legacy ParsedTransactionWithMeta', () => {
      const kitTx = {
        slot: 200000000n,
        blockTime: 1699999999n,
        transaction: {
          signatures: ['test-sig'],
          message: {
            accountKeys: [testAddressString],
          },
        },
        meta: {
          fee: 5000n,
          preBalances: [1000000n, 2000000n],
          postBalances: [995000n, 2000000n],
          err: null,
        },
      };

      const result = toLegacyParsedTransaction(kitTx);
      expect(result).not.toBeNull();
      expect(result!.slot).toBe(200000000);
      expect(result!.blockTime).toBe(1699999999);
      expect(result!.meta!.fee).toBe(5000);
      expect(result!.meta!.preBalances).toEqual([1000000, 2000000]);
      expect(result!.meta!.postBalances).toEqual([995000, 2000000]);
    });

    it('should handle null transaction', () => {
      expect(toLegacyParsedTransaction(null)).toBeNull();
    });

    it('should convert pubkey fields to PublicKey instances', () => {
      const kitTx = {
        slot: 200000000n,
        transaction: {
          message: {
            accountKeys: [
              {
                pubkey: testAddressString,
                signer: true,
                writable: true,
              },
            ],
          },
        },
        meta: null,
      };

      const result = toLegacyParsedTransaction(kitTx);
      expect(result).not.toBeNull();
      expect(result!.transaction.message.accountKeys[0].pubkey).toBeInstanceOf(PublicKey);
    });
  });

  describe('toLegacySignatureInfo', () => {
    it('should convert kit signature info to legacy ConfirmedSignatureInfo', () => {
      const kitSig = {
        signature: 'test-signature',
        slot: 200000000n,
        err: null,
        memo: null,
        blockTime: 1699999999n,
        confirmationStatus: 'confirmed',
      };

      const result = toLegacySignatureInfo(kitSig);
      expect(result.signature).toBe('test-signature');
      expect(result.slot).toBe(200000000);
      expect(result.blockTime).toBe(1699999999);
      expect(result.confirmationStatus).toBe('confirmed');
      expect(result.err).toBeNull();
    });

    it('should handle null signature', () => {
      expect(toLegacySignatureInfo(null)).toBeNull();
    });

    it('should preserve error information', () => {
      const kitSig = {
        signature: 'test-signature',
        slot: 200000000n,
        err: { InstructionError: [0, 'CustomError'] },
        memo: 'test memo',
        blockTime: 1699999999n,
        confirmationStatus: 'finalized',
      };

      const result = toLegacySignatureInfo(kitSig);
      expect(result.err).toEqual({ InstructionError: [0, 'CustomError'] });
      expect(result.memo).toBe('test memo');
    });

    it('should handle number values (already legacy)', () => {
      const legacySig = {
        signature: 'test-signature',
        slot: 200000000,
        err: null,
        memo: null,
        blockTime: 1699999999,
        confirmationStatus: 'confirmed',
      };

      const result = toLegacySignatureInfo(legacySig);
      expect(result.slot).toBe(200000000);
      expect(result.blockTime).toBe(1699999999);
    });
  });
});
