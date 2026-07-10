/**
 * Pure decoders for the registry program's zero-copy accounts.
 *
 * Offsets mirror the #[repr(C)] structs in
 * gridtokenx-anchor/programs/registry/src/state.rs — every account is
 * 8-byte discriminator + payload. Sizes and offsets are covered by fixture
 * tests in __tests__/registry-decoders.spec.ts; if the on-chain layout
 * changes, update both together.
 */
import { PublicKey } from '@solana/web3.js';

import { readU64LE, readI64LE, readU32LE, readI32LE, decodeAsciiId } from './bytes';

export const REGISTRY_ACCOUNT_SIZE = 136; // 128 payload + 8 disc
export const USER_ACCOUNT_SIZE = 112; // 104 payload + 8 disc
export const METER_ACCOUNT_SIZE = 128; // 120 payload + 8 disc

export const USER_TYPES: Record<number, string> = { 0: 'Prosumer', 1: 'Consumer' };
export const USER_STATUSES: Record<number, string> = { 0: 'Active', 1: 'Suspended', 2: 'Inactive' };
export const VALIDATOR_STATUSES: Record<number, string> = {
  0: 'None',
  1: 'Active',
  2: 'Slashed',
  3: 'Suspended',
  4: 'Resigning',
};
export const METER_TYPES: Record<number, string> = { 0: 'Solar', 1: 'Wind', 2: 'Battery', 3: 'Grid' };
export const METER_STATUSES: Record<number, string> = { 0: 'Active', 1: 'Inactive', 2: 'Maintenance' };

export interface RegistryData {
  address: string;
  authority: string;
  oracleAuthority: string | null;
  slashDestination: string | null;
  userCount: number;
  meterCount: number;
  activeMeterCount: number;
}

export interface RegistryUserData {
  address: string;
  authority: string;
  userType: string;
  status: string;
  validatorStatus: string;
  shardId: number;
  registeredAt: number;
  meterCount: number;
  stakedGrx: number;
}

export interface RegistryMeterData {
  address: string;
  meterId: string;
  owner: string;
  meterType: string;
  status: string;
  zoneId: number;
  registeredAt: number;
  lastReadingAt: number;
  totalGeneration: number;
  totalConsumption: number;
  settledNetGeneration: number;
  claimedErcGeneration: number;
}

const label = (map: Record<number, string>, v: number) => map[v] ?? `Unknown(${v})`;

function decodeIdBytes(buf: Uint8Array): string {
  return decodeAsciiId(buf);
}

/** Registry payload (state.rs): authority@0, oracle_authority@32,
 * has_oracle_authority@64, has_slash_destination@65, user_count@72,
 * meter_count@80, active_meter_count@88, slash_destination@96. */
export function decodeRegistry(data: Uint8Array, address: string): RegistryData {
  const d = data.subarray(8);
  return {
    activeMeterCount: Number(readU64LE(d, 88)),
    address,
    authority: new PublicKey(d.subarray(0, 32)).toBase58(),
    meterCount: Number(readU64LE(d, 80)),
    oracleAuthority: d[64] === 1 ? new PublicKey(d.subarray(32, 64)).toBase58() : null,
    slashDestination: d[65] === 1 ? new PublicKey(d.subarray(96, 128)).toBase58() : null,
    userCount: Number(readU64LE(d, 72)),
  };
}

/** UserAccount payload (state.rs): authority@0, user_type@32, status@56,
 * validator_status@57, shard_id@58, registered_at@64, meter_count@72,
 * staked_grx@80. */
export function decodeRegistryUser(data: Uint8Array, address: string): RegistryUserData {
  const d = data.subarray(8);
  return {
    address,
    authority: new PublicKey(d.subarray(0, 32)).toBase58(),
    meterCount: readU32LE(d, 72),
    registeredAt: Number(readI64LE(d, 64)),
    shardId: d[58],
    stakedGrx: Number(readU64LE(d, 80)),
    status: label(USER_STATUSES, d[56]),
    userType: label(USER_TYPES, d[32]),
    validatorStatus: label(VALIDATOR_STATUSES, d[57]),
  };
}

/** MeterAccount payload (state.rs): meter_id@0, owner@32, meter_type@64,
 * status@65, zone_id@68, registered_at@72, last_reading_at@80,
 * total_generation@88, total_consumption@96, settled_net_generation@104,
 * claimed_erc_generation@112. */
export function decodeRegistryMeter(data: Uint8Array, address: string): RegistryMeterData {
  const d = data.subarray(8);
  return {
    address,
    claimedErcGeneration: Number(readU64LE(d, 112)),
    lastReadingAt: Number(readI64LE(d, 80)),
    meterId: decodeIdBytes(d.subarray(0, 32)),
    meterType: label(METER_TYPES, d[64]),
    owner: new PublicKey(d.subarray(32, 64)).toBase58(),
    registeredAt: Number(readI64LE(d, 72)),
    settledNetGeneration: Number(readU64LE(d, 104)),
    status: label(METER_STATUSES, d[65]),
    totalConsumption: Number(readU64LE(d, 96)),
    totalGeneration: Number(readU64LE(d, 88)),
    zoneId: readI32LE(d, 68),
  };
}
