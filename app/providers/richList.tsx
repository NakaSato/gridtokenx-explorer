'use client';

import { useCluster } from '@providers/cluster';
import { AccountBalancePair } from '@solana/web3.js';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { createRpc, bigintToNumber, addressToPublicKey } from '@utils/rpc';
import React from 'react';

export enum Status {
  Idle,
  Disconnected,
  Connecting,
}

type RichLists = {
  total: AccountBalancePair[];
  circulating: AccountBalancePair[];
  nonCirculating: AccountBalancePair[];
};

type State = RichLists | Status | string;

type Dispatch = React.Dispatch<React.SetStateAction<State>>;
const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type Props = { children: React.ReactNode };
export function RichListProvider({ children }: Props) {
  const [state, setState] = React.useState<State>(Status.Idle);
  const { status: clusterStatus, cluster, url } = useCluster();

  React.useEffect(() => {
    if (state !== Status.Idle) {
      switch (clusterStatus) {
        case ClusterStatus.Connecting: {
          setState(Status.Disconnected);
          break;
        }
        case ClusterStatus.Connected: {
          fetch(setState, cluster, url);
          break;
        }
      }
    }
  }, [clusterStatus, cluster, url]); // eslint-disablline react-hooks/exhaustivdeps

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={setState}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

async function fetch(dispatch: Dispatch, cluster: Cluster, url: string) {
  dispatch(Status.Connecting);

  try {
    const rpc = createRpc(url);

    const [totalResponse, circulatingResponse, nonCirculatingResponse] = await Promise.all([
      rpc.getLargestAccounts({ commitment: 'finalized' }).send(),
      rpc.getLargestAccounts({ commitment: 'finalized', filter: 'circulating' }).send(),
      rpc.getLargestAccounts({ commitment: 'finalized', filter: 'nonCirculating' }).send(),
    ]);

    // Convert from kit types to legacy types
    const total: AccountBalancePair[] = totalResponse.map(item => ({
      address: addressToPublicKey(item.address),
      lamports: bigintToNumber(item.lamports),
    }));
    const circulating: AccountBalancePair[] = circulatingResponse.map(item => ({
      address: addressToPublicKey(item.address),
      lamports: bigintToNumber(item.lamports),
    }));
    const nonCirculating: AccountBalancePair[] = nonCirculatingResponse.map(item => ({
      address: addressToPublicKey(item.address),
      lamports: bigintToNumber(item.lamports),
    }));

    // Update state if still connecting
    dispatch(state => {
      if (state !== Status.Connecting) return state;
      return { circulating, nonCirculating, total };
    });
  } catch (err) {
    if (cluster !== Cluster.Custom) {
      console.error(err, { url });
    }
    dispatch('Failed to fetch top accounts');
  }
}

export function useRichList() {
  const state = React.useContext(StateContext);
  if (state === undefined) {
    throw new Error(`useRichList must be used within a RichListProvider`);
  }
  return state;
}

export function useFetchRichList() {
  const dispatch = React.useContext(DispatchContext);
  if (!dispatch) {
    throw new Error(`useFetchRichList must be used within a RichListProvider`);
  }

  const { cluster, url } = useCluster();
  return React.useCallback(() => {
    fetch(dispatch, cluster, url);
  }, [dispatch, cluster, url]);
}
