'use client';

import * as Cache from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { Cluster } from '@utils/cluster';
import { createRpc, bigintToNumber, addressToPublicKey } from '@utils/rpc';
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

type Block = {
  block?: VersionedBlockResponseLike;
  blockLeader?: PublicKeyLike;
  childSlot?: number;
  childLeader?: PublicKeyLike;
  parentLeader?: PublicKeyLike;
};

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
      const block = blockResponse as unknown as VersionedBlockResponseLike;
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
    if (cluster !== Cluster.Custom) {
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
