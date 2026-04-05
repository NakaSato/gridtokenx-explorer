/**
 * Common Type Definitions
 * Centralized type definitions for shared usage across the application
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Cluster types supported by the explorer
 */
export type ClusterType = 'localnet' | 'devnet' | 'testnet' | 'mainnet-beta' | 'custom';

/**
 * Base account information
 */
export interface AccountInfo {
  pubkey: PublicKey;
  lamports: number;
  executable: boolean;
  owner: PublicKey;
  space: number;
  data: Buffer;
}

/**
 * Parsed account data
 */
export interface ParsedAccountData<T = unknown> {
  program: string;
  parsed: {
    info: T;
    type: string;
  };
  space: number;
}

/**
 * Token information for labels
 */
export interface TokenLabelInfo {
  symbol?: string;
  name?: string;
  logo?: string;
}

/**
 * Transaction instruction types
 */
export interface InstructionType {
  type: string;
  info: Record<string, unknown>;
  programId: string;
  accounts?: string[];
  data?: string;
}

/**
 * Reward information from blocks
 */
export interface RewardInfo {
  pubkey: string;
  lamports: number;
  postBalance: number | null;
  rewardType: 'fee' | 'rent' | 'staking' | 'voting' | null;
}

/**
 * Slot information
 */
export interface SlotInfo {
  slot: number;
  parent: number;
  root: number;
}

/**
 * Epoch schedule information
 */
export interface EpochSchedule {
  slotsPerEpoch: number;
  leaderScheduleSlotOffset: number;
  warmup: boolean;
  firstNormalEpoch: number;
  firstNormalSlot: number;
}

/**
 * Generic async function type
 */
export type AsyncFunction<T = void> = () => Promise<T>;

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined;

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sorting parameters
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Date range filter
 */
export interface DateRange {
  from?: number;
  to?: number;
}

/**
 * React component props with children
 */
export type PropsWithChildren<P = Record<string, unknown>> = {
  children?: React.ReactNode;
} & P;

/**
 * Maybe type - value or null/undefined
 */
export type Maybe<T> = T | null | undefined;
