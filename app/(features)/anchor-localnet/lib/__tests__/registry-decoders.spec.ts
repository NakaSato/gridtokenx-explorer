import { PublicKey } from '@solana/web3.js';

import {
  decodeRegistry,
  decodeRegistryMeter,
  decodeRegistryUser,
  METER_ACCOUNT_SIZE,
  REGISTRY_ACCOUNT_SIZE,
  USER_ACCOUNT_SIZE,
} from '../registry-decoders';

// Fixtures are built field-by-field at the offsets defined by the #[repr(C)]
// structs in gridtokenx-anchor/programs/registry/src/state.rs. If a decoder
// offset drifts from the Rust layout, these specs fail.

const AUTHORITY = new PublicKey('4HB6s1bAiAPk8kxSatGd3U7bKArXXSoDfemfu23UZBdw');
const ORACLE = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const SLASH_DEST = new PublicKey('So11111111111111111111111111111111111111112');
const OWNER = new PublicKey('SysvarRent111111111111111111111111111111111');

const DISCRIMINATOR = 8;

function buildRegistryAccount(): Buffer {
  const buf = Buffer.alloc(REGISTRY_ACCOUNT_SIZE);
  const d = buf.subarray(DISCRIMINATOR);
  AUTHORITY.toBuffer().copy(d, 0); // authority: Pubkey            @0
  ORACLE.toBuffer().copy(d, 32); // oracle_authority: Pubkey       @32
  d[64] = 1; // has_oracle_authority: u8                           @64
  d[65] = 1; // has_slash_destination: u8                          @65
  d.writeBigUInt64LE(12n, 72); // user_count: u64                  @72
  d.writeBigUInt64LE(34n, 80); // meter_count: u64                 @80
  d.writeBigUInt64LE(30n, 88); // active_meter_count: u64          @88
  SLASH_DEST.toBuffer().copy(d, 96); // slash_destination: Pubkey  @96
  return buf;
}

function buildUserAccount(): Buffer {
  const buf = Buffer.alloc(USER_ACCOUNT_SIZE);
  const d = buf.subarray(DISCRIMINATOR);
  AUTHORITY.toBuffer().copy(d, 0); // authority: Pubkey    @0
  d[32] = 0; // user_type: Prosumer                        @32
  d[56] = 0; // status: Active                             @56
  d[57] = 1; // validator_status: Active                   @57
  d[58] = 3; // shard_id: u8                               @58
  d.writeBigInt64LE(1_750_000_000n, 64); // registered_at  @64
  d.writeUInt32LE(2, 72); // meter_count: u32               @72
  d.writeBigUInt64LE(5_000_000_000n, 80); // staked_grx    @80
  return buf;
}

function buildMeterAccount(): Buffer {
  const buf = Buffer.alloc(METER_ACCOUNT_SIZE);
  const d = buf.subarray(DISCRIMINATOR);
  Buffer.from('MTR-SOLAR-7').copy(d, 0); // meter_id: [u8; 32]        @0
  OWNER.toBuffer().copy(d, 32); // owner: Pubkey                      @32
  d[64] = 0; // meter_type: Solar                                     @64
  d[65] = 0; // status: Active                                        @65
  d.writeInt32LE(4, 68); // zone_id: i32                              @68
  d.writeBigInt64LE(1_750_000_000n, 72); // registered_at             @72
  d.writeBigInt64LE(1_751_700_600n, 80); // last_reading_at           @80
  d.writeBigUInt64LE(9_000n, 88); // total_generation                 @88
  d.writeBigUInt64LE(4_000n, 96); // total_consumption                @96
  d.writeBigUInt64LE(3_500n, 104); // settled_net_generation          @104
  d.writeBigUInt64LE(1_200n, 112); // claimed_erc_generation          @112
  return buf;
}

describe('decodeRegistry', () => {
  it('decodes every field at the repr(C) offsets', () => {
    expect(decodeRegistry(buildRegistryAccount(), 'regAddr')).toEqual({
      activeMeterCount: 30,
      address: 'regAddr',
      authority: AUTHORITY.toBase58(),
      meterCount: 34,
      oracleAuthority: ORACLE.toBase58(),
      slashDestination: SLASH_DEST.toBase58(),
      userCount: 12,
    });
  });

  it('nulls oracle/slash when their has_* flags are unset', () => {
    const buf = buildRegistryAccount();
    buf.subarray(DISCRIMINATOR)[64] = 0;
    buf.subarray(DISCRIMINATOR)[65] = 0;
    const reg = decodeRegistry(buf, 'regAddr');
    expect(reg.oracleAuthority).toBeNull();
    expect(reg.slashDestination).toBeNull();
  });
});

describe('decodeRegistryUser', () => {
  it('decodes every field at the repr(C) offsets', () => {
    expect(decodeRegistryUser(buildUserAccount(), 'userAddr')).toEqual({
      address: 'userAddr',
      authority: AUTHORITY.toBase58(),
      meterCount: 2,
      registeredAt: 1_750_000_000,
      shardId: 3,
      stakedGrx: 5_000_000_000,
      status: 'Active',
      userType: 'Prosumer',
      validatorStatus: 'Active',
    });
  });
});

describe('decodeRegistryMeter', () => {
  it('decodes every field at the repr(C) offsets', () => {
    expect(decodeRegistryMeter(buildMeterAccount(), 'meterAddr')).toEqual({
      address: 'meterAddr',
      claimedErcGeneration: 1_200,
      lastReadingAt: 1_751_700_600,
      meterId: 'MTR-SOLAR-7',
      meterType: 'Solar',
      owner: OWNER.toBase58(),
      registeredAt: 1_750_000_000,
      settledNetGeneration: 3_500,
      status: 'Active',
      totalConsumption: 4_000,
      totalGeneration: 9_000,
      zoneId: 4,
    });
  });

  it('labels out-of-range enum bytes as Unknown', () => {
    const buf = buildMeterAccount();
    buf.subarray(DISCRIMINATOR)[64] = 9;
    expect(decodeRegistryMeter(buf, 'meterAddr').meterType).toBe('Unknown(9)');
  });
});
