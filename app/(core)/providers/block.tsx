'use client';

import * as Cache from '@/app/(core)/providers/cache';
import { useCluster } from '@/app/(core)/providers/cluster';
import { Cluster } from '@/app/(shared)/utils/cluster';
import { createRpc, bigintToNumber, addressToPublicKey } from '@/app/(shared)/utils/rpc';
import React from 'react';

/**
 * Type aliases compatible with @solana/web3.js types
 * Maintains structural compatibility without requiring the import
 */
type PublicKeyLike = {
  toBase58(): string;
  equals(other: PublicKeyLike): boolean;
};

type VersionedBlockResponseLike = {
  blockhash: string;
  previousBlockhash: string;
  parentSlot: number;
  transactions: Array<{
    transaction: {
      message: {
        compiledInstructions: Array<{
          programIdIndex: number;
          data: Uint8Array;
        }>;
        getAccountKeys: (args?: any) => {
          staticAccountKeys: Array<{ toBase58(): string }>;
          get: (index: number) => { toBase58(): string } | undefined;
        };
      };
      signatures: string[];
    };
    meta: {
      err: any;
      fee: number;
      computeUnitsConsumed?: number;
      costUnits?: number;
      innerInstructions?: Array<{
        index: number;
        instructions: Array<{ programIdIndex: number }>;
      }>;
      logMessages?: string[] | null;
      loadedAddresses?: any;
    } | null;
  }>;
  blockTime: number | null;
  blockHeight: number | null;
  rewards?: Array<{
    pubkey: string;
    lamports: number;
    postBalance: number;
    rewardType: string | null;
    commission: number | null;
  }>;
};

export enum FetchStatus {
  Fetching,
  FetchFailed,
  Fetched,
}

export enum ActionType {
  Clear,
  Update,
}

type Block = {
  block?: VersionedBlockResponseLike;
  blockLeader?: PublicKeyLike;
  childSlot?: number;
  childLeader?: PublicKeyLike;
  parentLeader?: PublicKeyLike;
  errorMessage?: string;
};

/** Block-availability errors that are expected on ledger-limited validators (pruned/skipped/not-yet-confirmed). */
function isExpectedBlockUnavailable(message: string): boolean {
  return /cleaned up|does not exist|not available|was skipped|is not available/i.test(message);
}

type State = Cache.State<Block>;
type Dispatch = Cache.Dispatch<Block>;

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type BlockProviderProps = { children: React.ReactNode };

export function BlockProvider({ children }: BlockProviderProps) {
  const { url } = useCluster();
  const reducerResult = Cache.useReducer<Block>(url);
  const state = reducerResult[0] as unknown as State;
  const dispatch = reducerResult[1] as unknown as Dispatch;

  React.useEffect(() => {
    dispatch({ type: Cache.ActionType.Clear, url });
  }, [dispatch, url]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useBlock(key: number): Cache.CacheEntry<Block> | undefined {
  const context = React.useContext(StateContext);

  if (!context) {
    throw new Error(`useBlock must be used within a BlockProvider`);
  }

  return context.entries[key];
}

export async function fetchBlock(dispatch: Dispatch, url: string, cluster: Cluster, slot: number) {
  dispatch({
    key: slot,
    status: FetchStatus.Fetching,
    type: Cache.ActionType.Update,
    url,
  });

  let status: FetchStatus;
  let data: Block | undefined = undefined;

  try {
    const rpc = createRpc(url);
    const blockResponse = await rpc
      .getBlock(BigInt(slot), {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      })
      .send();
    if (blockResponse === null) {
      data = {};
      status = FetchStatus.Fetched;
    } else {
      // Convert kit response to VersionedBlockResponseLike format
      const blockRaw = blockResponse as any;
      const block: VersionedBlockResponseLike = {
        ...blockRaw,
        parentSlot: typeof blockRaw.parentSlot === 'bigint' ? Number(blockRaw.parentSlot) : blockRaw.parentSlot,
        blockTime: blockRaw.blockTime !== null && typeof blockRaw.blockTime === 'bigint' ? Number(blockRaw.blockTime) : blockRaw.blockTime,
        blockHeight: blockRaw.blockHeight !== null && typeof blockRaw.blockHeight === 'bigint' ? Number(blockRaw.blockHeight) : blockRaw.blockHeight,
      };
      
      // The kit RPC returns each message as raw JSON: `accountKeys` (base58 strings),
      // `header`, and `instructions` ({ programIdIndex, accounts, data }). The block
      // cards, though, consume the web3.js VersionedMessage API — `compiledInstructions`,
      // `staticAccountKeys`, `getAccountKeys()`, `isAccountWritable()`. Bridge the two
      // shapes once here so every consumer sees a consistent object (idempotent: a real
      // web3.js message already carrying both fields is left untouched).
      block.transactions.forEach(tx => {
        const message = tx.transaction.message as any;
        if (message.getAccountKeys && message.compiledInstructions) return;

        // Wrap kit's base58 string keys as PublicKey-like { toBase58 } objects.
        const wrap = (k: any) =>
          typeof k === 'string'
            ? { toBase58: () => k, equals: (o: any) => o?.toBase58?.() === k }
            : k;
        const rawKeys: any[] = message.staticAccountKeys || message.accountKeys || [];
        const staticKeys = rawKeys.map(wrap);
        const header = message.header || {
          numRequiredSignatures: 0,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 0,
        };

        // instructions → compiledInstructions (accounts → accountKeyIndexes).
        const rawIx: any[] = message.compiledInstructions || message.instructions || [];
        message.compiledInstructions = rawIx.map(ix => ({
          programIdIndex: ix.programIdIndex,
          accountKeyIndexes: ix.accountKeyIndexes || ix.accounts || [],
          data: ix.data,
        }));
        message.staticAccountKeys = staticKeys;

        message.getAccountKeys = (args?: { accountKeysFromLookups?: any }) => {
          const loaded = args?.accountKeysFromLookups || { writable: [], readonly: [] };
          const writable = (loaded.writable || []).map(wrap);
          const readonly = (loaded.readonly || []).map(wrap);
          const all = [...staticKeys, ...writable, ...readonly];
          return {
            staticAccountKeys: staticKeys,
            length: all.length,
            get: (index: number) => all[index],
            keySegments: () => {
              const segments = [staticKeys];
              if (writable.length) segments.push(writable);
              if (readonly.length) segments.push(readonly);
              return segments;
            },
          };
        };

        // web3.js MessageV0.isAccountWritable: writable lookups precede readonly ones;
        // static keys split by the header's signed/readonly counts.
        message.isAccountWritable = (index: number) => {
          const numSigned = header.numRequiredSignatures ?? 0;
          const numStatic = staticKeys.length;
          if (index >= numStatic) {
            const loaded = tx.meta?.loadedAddresses || { writable: [] };
            return index - numStatic < (loaded.writable?.length || 0);
          }
          if (index < numSigned) {
            return index < numSigned - (header.numReadonlySignedAccounts ?? 0);
          }
          return index - numSigned < numStatic - numSigned - (header.numReadonlyUnsignedAccounts ?? 0);
        };
      });
      
      const childSlots = await rpc.getBlocks(BigInt(slot + 1), BigInt(slot + 100), { commitment: 'confirmed' }).send();
      const childSlotArray = Array.from(childSlots);
      const childSlot = childSlotArray.length > 0 ? bigintToNumber(childSlotArray[0]) : undefined;
      const firstLeaderSlot = block.parentSlot;

      let leaders: PublicKeyLike[] = [];
      try {
        const lastLeaderSlot = childSlot !== undefined ? childSlot : slot;
        const slotLeadersLimit = lastLeaderSlot - block.parentSlot + 1;
        const leaderAddresses = await rpc.getSlotLeaders(BigInt(firstLeaderSlot), slotLeadersLimit).send();
        leaders = leaderAddresses.map(addr => addressToPublicKey(addr));
      } catch (err) {
        // ignore errors
      }

      const getLeader = (slot: number) => {
        return leaders.at(slot - Number(firstLeaderSlot));
      };

      data = {
        block,
        blockLeader: getLeader(slot),
        childLeader: childSlot !== undefined ? getLeader(childSlot) : undefined,
        childSlot,
        parentLeader: getLeader(Number(block.parentSlot)),
      };
      status = FetchStatus.Fetched;
    }
  } catch (err) {
    status = FetchStatus.FetchFailed;
    const message = err instanceof Error ? err.message : String(err);
    data = { errorMessage: message };
    // Pruned/skipped blocks are normal on a ledger-limited validator — don't spam the console.
    if (cluster !== Cluster.Custom && !isExpectedBlockUnavailable(message)) {
      console.error(err, { tags: { url } });
    }
  }

  dispatch({
    data,
    key: slot,
    status,
    type: Cache.ActionType.Update,
    url,
  });
}

export function useFetchBlock() {
  const dispatch = React.useContext(DispatchContext);
  if (!dispatch) {
    throw new Error(`useFetchBlock must be used within a BlockProvider`);
  }

  const { cluster, url } = useCluster();
  return React.useCallback((key: number) => fetchBlock(dispatch, url, cluster, key), [dispatch, cluster, url]);
}
