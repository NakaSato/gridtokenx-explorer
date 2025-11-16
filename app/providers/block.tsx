'use client';

import * as Cache from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { PublicKey, VersionedBlockResponse } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { createRpc, bigintToNumber, addressToPublicKey } from '@utils/rpc';
import React from 'react';

export enum FetchStatus {
    Fetching,
    FetchFailed,
    Fetched,
}

export enum ActionType {
    Update,
    Clear,
}

type Block = {
    block?: VersionedBlockResponse;
    blockLeader?: PublicKey;
    childSlot?: number;
    childLeader?: PublicKey;
    parentLeader?: PublicKey;
};

type State = Cache.State<Block>;
type Dispatch = Cache.Dispatch<Block>;

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type BlockProviderProps = { children: React.ReactNode };

export function BlockProvider({ children }: BlockProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useReducer<Block>(url);

    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
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
        type: ActionType.Update,
        url,
    });

    let status: FetchStatus;
    let data: Block | undefined = undefined;

    try {
        const rpc = createRpc(url);
        const blockResponse = await rpc.getBlock(BigInt(slot), {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
        }).send();
        if (blockResponse === null) {
            data = {};
            status = FetchStatus.Fetched;
        } else {
            // Convert kit response to legacy VersionedBlockResponse format
            const block = blockResponse as unknown as VersionedBlockResponse;
            const childSlots = await rpc.getBlocks(BigInt(slot + 1), BigInt(slot + 100), { commitment: 'confirmed' }).send();
            const childSlotArray = Array.from(childSlots);
            const childSlot = childSlotArray.length > 0 ? bigintToNumber(childSlotArray[0]) : undefined;
            const firstLeaderSlot = block.parentSlot;

            let leaders: PublicKey[] = [];
            try {
                const lastLeaderSlot = childSlot !== undefined ? childSlot : slot;
                const slotLeadersLimit = lastLeaderSlot - block.parentSlot + 1;
                const leaderAddresses = await rpc.getSlotLeaders(BigInt(firstLeaderSlot), slotLeadersLimit).send();
                leaders = leaderAddresses.map(addr => addressToPublicKey(addr));
            } catch (err) {
                // ignore errors
            }

            const getLeader = (slot: number) => {
                return leaders.at(slot - firstLeaderSlot);
            };

            data = {
                block,
                blockLeader: getLeader(slot),
                childLeader: childSlot !== undefined ? getLeader(childSlot) : undefined,
                childSlot,
                parentLeader: getLeader(block.parentSlot),
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
        type: ActionType.Update,
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
