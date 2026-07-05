import { PublicKey } from '@solana/web3.js';

import {
  decodeEnergyTokenInfo,
  decodeGenerationMintRecord,
  decodeMeterId,
  GENERATION_MINT_RECORD_ACCOUNT_SIZE,
  TOKEN_INFO_ACCOUNT_SIZE,
} from '../energy-token-decoders';

// Fixtures are built field-by-field at the offsets defined by the structs in
// gridtokenx-anchor/programs/energy-token/src/state.rs. If a decoder offset
// drifts from the Rust layout, these specs fail.

const AUTHORITY = new PublicKey('4HB6s1bAiAPk8kxSatGd3U7bKArXXSoDfemfu23UZBdw');
const REGISTRY_AUTHORITY = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const REGISTRY_PROGRAM = new PublicKey('So11111111111111111111111111111111111111112');
const MINT = new PublicKey('SysvarRent111111111111111111111111111111111');
const VALIDATOR = new PublicKey('SysvarC1ock11111111111111111111111111111111');

const DISCRIMINATOR = 8;

function buildTokenInfoAccount(): Buffer {
  const buf = Buffer.alloc(TOKEN_INFO_ACCOUNT_SIZE);
  const d = buf.subarray(DISCRIMINATOR);
  AUTHORITY.toBuffer().copy(d, 0); // authority: Pubkey             @0
  REGISTRY_AUTHORITY.toBuffer().copy(d, 32); // registry_authority  @32
  REGISTRY_PROGRAM.toBuffer().copy(d, 64); // registry_program      @64
  MINT.toBuffer().copy(d, 96); // mint: Pubkey                      @96
  d.writeBigUInt64LE(1_928_603_113_256n, 128); // total_supply: u64 @128
  d.writeBigInt64LE(1_750_000_000n, 136); // created_at: i64        @136
  VALIDATOR.toBuffer().copy(d, 144); // rec_validators[0]           @144
  d[304] = 1; // rec_validators_count: u8                           @304
  return buf;
}

function buildGenerationMintRecord(): Buffer {
  const buf = Buffer.alloc(GENERATION_MINT_RECORD_ACCOUNT_SIZE);
  const d = buf.subarray(DISCRIMINATOR);
  Buffer.from('METER-001').copy(d, 0); // meter_id: [u8; 16]        @0
  d.writeBigInt64LE(1_751_700_600_000n, 16); // window_start_ms     @16
  d.writeBigUInt64LE(8_445_000n, 24); // amount: u64                @24
  d[32] = 1; // minted: bool                                        @32
  d[33] = 253; // bump: u8                                          @33
  return buf;
}

describe('decodeEnergyTokenInfo', () => {
  it('decodes every field at the state.rs offsets', () => {
    const info = decodeEnergyTokenInfo(buildTokenInfoAccount(), 'infoAddr');

    expect(info).toEqual({
      address: 'infoAddr',
      authority: AUTHORITY.toBase58(),
      createdAt: 1_750_000_000,
      mint: MINT.toBase58(),
      recValidators: [VALIDATOR.toBase58()],
      recValidatorsCount: 1,
      registryAuthority: REGISTRY_AUTHORITY.toBase58(),
      registryProgram: REGISTRY_PROGRAM.toBase58(),
      totalSupply: 1_928_603_113_256,
    });
  });

  it('lists only the first rec_validators_count validators', () => {
    const buf = buildTokenInfoAccount();
    buf.subarray(DISCRIMINATOR)[304] = 0;
    expect(decodeEnergyTokenInfo(buf, 'infoAddr').recValidators).toEqual([]);
  });
});

describe('decodeGenerationMintRecord', () => {
  it('decodes every field at the state.rs offsets', () => {
    const rec = decodeGenerationMintRecord(buildGenerationMintRecord(), 'recAddr');

    expect(rec).toEqual({
      address: 'recAddr',
      amount: 8_445_000,
      bump: 253,
      meterId: 'METER-001',
      minted: true,
      windowMs: 1_751_700_600_000,
    });
  });

  it('treats a zeroed minted byte as pending', () => {
    const buf = buildGenerationMintRecord();
    buf.subarray(DISCRIMINATOR)[32] = 0;
    expect(decodeGenerationMintRecord(buf, 'recAddr').minted).toBe(false);
  });
});

describe('decodeMeterId', () => {
  it('returns printable ASCII ids with padding trimmed', () => {
    const buf = Buffer.alloc(16);
    Buffer.from('MTR-42').copy(buf, 0);
    expect(decodeMeterId(buf)).toBe('MTR-42');
  });

  it('falls back to hex for binary (UUID) ids', () => {
    const buf = Buffer.from('2f874d068e405bff9712c1e2fb342226', 'hex');
    expect(decodeMeterId(buf)).toBe('2f874d068e405bff9712c1e2fb342226');
  });
});
