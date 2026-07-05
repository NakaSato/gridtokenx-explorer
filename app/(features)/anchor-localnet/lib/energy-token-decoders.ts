/**
 * Pure decoders for the energy-token program's accounts.
 *
 * Offsets mirror the structs in
 * gridtokenx-anchor/programs/energy-token/src/state.rs — every account is
 * 8-byte discriminator + payload. Sizes and offsets are covered by fixture
 * tests in __tests__/energy-token-decoders.spec.ts; if the on-chain layout
 * changes, update both together.
 */
import { PublicKey } from '@solana/web3.js';

export const TOKEN_INFO_ACCOUNT_SIZE = 320; // 312 payload + 8 disc
export const GENERATION_MINT_RECORD_ACCOUNT_SIZE = 42; // 34 payload + 8 disc

export const GRX_DECIMALS = 9;

/** Settlement windows are fixed 15-minute buckets (Aggregator Bridge contract). */
export const SETTLEMENT_WINDOW_MS = 15 * 60 * 1000;

export interface EnergyTokenInfoData {
  address: string;
  authority: string;
  registryAuthority: string;
  registryProgram: string;
  mint: string;
  totalSupply: number;
  createdAt: number;
  recValidators: string[];
  recValidatorsCount: number;
}

/** One PDA per (meter, 15-min settlement window) recording the GRX minted. */
export interface GenerationMintRecordData {
  address: string;
  meterId: string;
  windowMs: number;
  amount: number;
  minted: boolean;
  bump: number;
}

export function decodeMeterId(buf: Buffer): string {
  // meter_id is 16 bytes; the seeder stores an ASCII id. Fall back to hex.
  const ascii = buf.toString('ascii').replace(/[\x00\s]+$/g, ''); // trim trailing NUL/space padding
  return /^[\x20-\x7e]+$/.test(ascii) ? ascii : buf.toString('hex');
}

/** TokenInfo payload (state.rs): authority@0, registry_authority@32,
 * registry_program@64, mint@96, total_supply@128, created_at@136,
 * rec_validators[5]@144, rec_validators_count@304. */
export function decodeEnergyTokenInfo(data: Buffer, address: string): EnergyTokenInfoData {
  const d = data.subarray(8);
  const count = d[304];
  const recValidators: string[] = [];
  for (let i = 0; i < count && i < 5; i++) {
    recValidators.push(new PublicKey(d.subarray(144 + i * 32, 176 + i * 32)).toBase58());
  }
  return {
    address,
    authority: new PublicKey(d.subarray(0, 32)).toBase58(),
    createdAt: Number(d.readBigInt64LE(136)),
    mint: new PublicKey(d.subarray(96, 128)).toBase58(),
    recValidators,
    recValidatorsCount: count,
    registryAuthority: new PublicKey(d.subarray(32, 64)).toBase58(),
    registryProgram: new PublicKey(d.subarray(64, 96)).toBase58(),
    totalSupply: Number(d.readBigUInt64LE(128)),
  };
}

/** GenerationMintRecord payload (state.rs): meter_id@0, window_start_ms@16,
 * amount@24, minted@32, bump@33. */
export function decodeGenerationMintRecord(data: Buffer, address: string): GenerationMintRecordData {
  const d = data.subarray(8);
  return {
    address,
    amount: Number(d.readBigUInt64LE(24)),
    bump: d[33],
    meterId: decodeMeterId(d.subarray(0, 16) as Buffer),
    minted: d[32] === 1,
    windowMs: Number(d.readBigInt64LE(16)),
  };
}
