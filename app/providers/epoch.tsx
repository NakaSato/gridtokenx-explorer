'use client';

import * as Cache from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { Cluster } from '@utils/cluster';
import { createRpc, bigintToNumber } from '@utils/rpc';
import React from 'react';

import { EpochSchedule, getFirstSlotInEpoch, getLastSlotInEpoch } from '../utils/epoch-schedule';

export enum FetchStatus {
    Fetching,
    FetchFailed,
    Fetched,
}

export enum ActionType {
    Update,
    Clear,
}

type Epoch = {
    firstBlock: number;
    firstTimestamp: number | null;
    lastBlock?: number;
    lastTimestamp: number | null;
};

type State = Cache.State<Epoch>;
type Dispatch = Cache.Dispatch<Epoch>;

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type EpochProviderProps = { children: React.ReactNode };

export function EpochProvider({ children }: EpochProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useReducer<Epoch>(url);

    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
    }, [dispatch, url]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
        </StateContext.Provider>
    );
}

export function useEpoch(key: number): Cache.CacheEntry<Epoch> | undefined {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useEpoch must be used within a EpochProvider`);
    }

    return context.entries[key];
}

export async function fetchEpoch(
    dispatch: Dispatch,
    url: string,
    cluster: Cluster,
    epochSchedule: EpochSchedule,
    currentEpoch: bigint,
    epoch: number
) {
    dispatch({
        key: epoch,
        status: FetchStatus.Fetching,
        type: ActionType.Update,
        url,
    });

    let status: FetchStatus;
    let data: Epoch | undefined = undefined;

    try {
        const rpc = createRpc(url);
        const firstSlot = getFirstSlotInEpoch(epochSchedule, BigInt(epoch));
        const lastSlot = getLastSlotInEpoch(epochSchedule, BigInt(epoch));
        const [firstBlock, lastBlock] = await Promise.all([
            (async () => {
                const firstBlocks = await rpc.getBlocks(firstSlot, firstSlot + 100n, { commitment: 'confirmed' }).send();
                const firstBlockArray = Array.from(firstBlocks);
                return firstBlockArray.length > 0 ? bigintToNumber(firstBlockArray[0]) : undefined;
            })(),
            (async () => {
                const startSlot = lastSlot > 100n ? lastSlot - 100n : 0n;
                const lastBlocks = await rpc.getBlocks(startSlot, lastSlot, { commitment: 'confirmed' }).send();
                const lastBlockArray = Array.from(lastBlocks);
                return lastBlockArray.length > 0 ? bigintToNumber(lastBlockArray[lastBlockArray.length - 1]) : undefined;
            })(),
        ]);

        if (firstBlock === undefined) {
            throw new Error(`failed to find confirmed block at start of epoch ${epoch}`);
        } else if (epoch < currentEpoch && lastBlock === undefined) {
            throw new Error(`failed to find confirmed block at end of epoch ${epoch}`);
        }

        const [firstTimestamp, lastTimestamp] = await Promise.all([
            rpc.getBlockTime(BigInt(firstBlock)).send().then(t => t !== null ? bigintToNumber(t) : null),
            lastBlock ? rpc.getBlockTime(BigInt(lastBlock)).send().then(t => t !== null ? bigintToNumber(t) : null) : null,
        ]);

        data = {
            firstBlock,
            firstTimestamp,
            lastBlock,
            lastTimestamp,
        };
        status = FetchStatus.Fetched;
    } catch (err) {
        status = FetchStatus.FetchFailed;
        if (cluster !== Cluster.Custom) {
            console.error(err, { epoch: epoch.toString() });
        }
    }

    dispatch({
        data,
        key: epoch,
        status,
        type: ActionType.Update,
        url,
    });
}

export function useFetchEpoch() {
    const dispatch = React.useContext(DispatchContext);
    if (!dispatch) {
        throw new Error(`useFetchEpoch must be used within a EpochProvider`);
    }

    const { cluster, url } = useCluster();
    return React.useCallback(
        (key: number, currentEpoch: bigint, epochSchedule: EpochSchedule) =>
            fetchEpoch(dispatch, url, cluster, epochSchedule, currentEpoch, key),
        [dispatch, cluster, url]
    );
}
