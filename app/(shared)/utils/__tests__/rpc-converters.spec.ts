import { describe, expect, it } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { address } from '@solana/kit';
import {
  toAddress,
  publicKeyToAddress,
  addressToPublicKey,
  bigintToNumber,
  bigintToNumberLossy,
  isPublicKeyLike,
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

  describe('bigintToNumberLossy', () => {
    it('should convert small bigint exactly', () => {
      expect(bigintToNumberLossy(5000n)).toBe(5000);
    });

    it('should NOT throw for lamport balances exceeding MAX_SAFE_INTEGER', () => {
      // Regression: large faucet/rent-exempt balances (u64) crashed the tx page.
      const huge = 499999999993855000n;
      expect(() => bigintToNumberLossy(huge)).not.toThrow();
      expect(bigintToNumberLossy(huge)).toBe(Number(huge));
    });

    it('should tolerate u64::MAX (rentEpoch of rent-exempt accounts)', () => {
      expect(() => bigintToNumberLossy(18446744073709551615n)).not.toThrow();
    });
  });

  describe('isPublicKeyLike', () => {
    it('duck-types a PublicKey via toBase58', () => {
      expect(isPublicKeyLike(testPubkey)).toBe(true);
    });

    it('rejects strings, null, and plain objects', () => {
      expect(isPublicKeyLike(testAddressString)).toBe(false);
      expect(isPublicKeyLike(null)).toBe(false);
      expect(isPublicKeyLike({})).toBe(false);
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

    it('should not throw for huge lamports and u64::MAX rentEpoch', () => {
      const kitAccount = {
        data: Buffer.from('test'),
        executable: false,
        lamports: 499999999993855000n,
        owner: testAddress,
        rentEpoch: 18446744073709551615n,
      };
      const result = toLegacyAccountInfo(kitAccount);
      expect(result.lamports).toBe(Number(499999999993855000n));
      expect(result.rentEpoch).toBe(Number(18446744073709551615n));
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

    it('should not throw for balances exceeding MAX_SAFE_INTEGER', () => {
      // Regression: a 0.5B-SOL faucet balance threw in bigintToNumber and failed
      // the whole tx fetch (FetchFailed).
      const kitTx = {
        slot: 200000000n,
        transaction: { message: { accountKeys: [] } },
        meta: {
          fee: 5000n,
          preBalances: [499999999993855000n, 2000000n],
          postBalances: [499999999993850000n, 2000000n],
          err: null,
        },
      };
      const result = toLegacyParsedTransaction(kitTx);
      expect(result!.meta!.preBalances[0]).toBe(Number(499999999993855000n));
    });

    it('should preserve ix.parsed.info pubkeys as strings (not PublicKey)', () => {
      // Detail cards coerce info strings via superstruct PublicKeyFromString;
      // eagerly converting here leaked foreign-instance PublicKey objects.
      const kitTx = {
        slot: 1n,
        transaction: {
          message: {
            accountKeys: [{ pubkey: testAddressString, signer: true, writable: true }],
            instructions: [
              {
                program: 'vote',
                programId: testAddressString,
                parsed: { type: 'vote', info: { voteAuthority: testAddressString } },
              },
            ],
          },
        },
        meta: null,
      };
      const result = toLegacyParsedTransaction(kitTx);
      const ix = result!.transaction.message.instructions[0];
      expect(typeof ix.parsed.info.voteAuthority).toBe('string');
      expect(ix.programId).toBeInstanceOf(PublicKey);
    });

    it('should normalize bigint numeric fields in ix.parsed.info to number', () => {
      // kit's jsonParsed returns lamports/space as bigint; detail cards validate
      // with superstruct number(), which rejects bigint. Keep addresses strings.
      const kitTx = {
        slot: 1n,
        transaction: {
          message: {
            accountKeys: [{ pubkey: testAddressString, signer: true, writable: true }],
            instructions: [
              {
                program: 'system',
                programId: testAddressString,
                parsed: {
                  type: 'createAccount',
                  info: { lamports: 2074080n, space: 165n, newAccount: testAddressString },
                },
              },
            ],
          },
        },
        meta: null,
      };
      const result = toLegacyParsedTransaction(kitTx);
      const info = result!.transaction.message.instructions[0].parsed.info;
      expect(info.lamports).toBe(2074080);
      expect(typeof info.lamports).toBe('number');
      expect(info.space).toBe(165);
      expect(typeof info.newAccount).toBe('string');
    });

    it('should keep recentBlockhash a string (rendered raw in Overview)', () => {
      // Regression: a blockhash is a 32-byte base58 string — address-shaped — so
      // the old blanket conversion turned it into a PublicKey; rendering it raw
      // threw React #31 "Objects are not valid as a React child (PublicKey)".
      const kitTx = {
        slot: 1n,
        transaction: {
          message: { accountKeys: [], instructions: [], recentBlockhash: testAddressString },
        },
        meta: null,
      };
      const result = toLegacyParsedTransaction(kitTx);
      expect(typeof result!.transaction.message.recentBlockhash).toBe('string');
    });

    it('should NOT convert address-length non-address fields rendered as raw text', () => {
      // Regression (React #31): any address-shaped string outside a known address
      // position must stay a string. Only pubkey/programId/accounts convert.
      const kitTx = {
        slot: 1n,
        transaction: {
          message: {
            accountKeys: [{ pubkey: testAddressString, signer: true, writable: true }],
            addressTableLookups: [{ accountKey: testAddressString, writableIndexes: [0], readonlyIndexes: [] }],
            instructions: [
              {
                programId: testAddressString,
                accounts: [testAddressString],
                // 32-byte-decodable base58 data must not become a PublicKey.
                data: testAddressString,
              },
            ],
            recentBlockhash: testAddressString,
          },
        },
        meta: null,
      };
      const result = toLegacyParsedTransaction(kitTx);
      const msg = result!.transaction.message;
      // Converted (address positions):
      expect(msg.accountKeys[0].pubkey).toBeInstanceOf(PublicKey);
      expect(msg.instructions[0].programId).toBeInstanceOf(PublicKey);
      expect(msg.instructions[0].accounts[0]).toBeInstanceOf(PublicKey);
      // Preserved as strings (raw-text / non-address positions):
      expect(typeof msg.instructions[0].data).toBe('string');
      expect(typeof msg.addressTableLookups[0].accountKey).toBe('string');
      expect(typeof msg.recentBlockhash).toBe('string');
    });

    it('should keep token-balance mint a string (fixes ref-equality mint-change bug)', () => {
      // meta.*TokenBalances[].mint is consumed via toAddress()/Map keys as a
      // string; converting it to PublicKey made `preBalance.mint !== mint`
      // compare object identity and spuriously emit mint-change rows.
      const kitTx = {
        slot: 1n,
        transaction: { message: { accountKeys: [], instructions: [] } },
        meta: {
          fee: 5000n,
          preBalances: [],
          postBalances: [],
          preTokenBalances: [{ accountIndex: 0, mint: testAddressString, owner: testAddressString }],
          postTokenBalances: [{ accountIndex: 0, mint: testAddressString, owner: testAddressString }],
          err: null,
        },
      };
      const result = toLegacyParsedTransaction(kitTx);
      expect(typeof result!.meta!.preTokenBalances[0].mint).toBe('string');
      expect(typeof result!.meta!.postTokenBalances[0].owner).toBe('string');
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
