'use client';

import { createSolanaRpc } from '@solana/kit';
import { Cluster, clusterName, ClusterStatus, clusterUrl, DEFAULT_CLUSTER } from '@/app/(shared)/utils/cluster';
import { localStorageIsAvailable } from '@/app/(shared)/utils/local-storage';
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';

import { EpochSchedule } from '@/app/(shared)/utils/epoch-schedule';

type Action = State;

interface EpochInfo {
  absoluteSlot: bigint;
  blockHeight: bigint;
  epoch: bigint;
  slotIndex: bigint;
  slotsInEpoch: bigint;
}

export interface ClusterInfo {
  firstAvailableBlock: bigint;
  epochSchedule: EpochSchedule;
  epochInfo: EpochInfo;
}

type Dispatch = (action: Action) => void;

type SetShowModal = React.Dispatch<React.SetStateAction<boolean>>;

interface State {
  cluster: Cluster;
  customUrl: string;
  clusterInfo?: ClusterInfo;
  status: ClusterStatus;
}

// Use local RPC URL from environment or fallback to localhost:8899
const DEFAULT_CUSTOM_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_HTTP || 'http://localhost:8899';

function clusterReducer(state: State, action: Action): State {
  switch (action.status) {
    case ClusterStatus.Connected:
    case ClusterStatus.Failure: {
      if (state.cluster !== action.cluster || state.customUrl !== action.customUrl) return state;
      return action;
    }
    case ClusterStatus.Connecting: {
      return action;
    }
  }
}

function parseQuery(searchParams: ReadonlyURLSearchParams | null): Cluster {
  const clusterParam = searchParams?.get('cluster');
  switch (clusterParam) {
    case 'custom':
      return Cluster.Custom;
    case 'devnet':
      return Cluster.Devnet;
    case 'testnet':
      return Cluster.Testnet;
    case 'mainnet-beta':
    default:
      return Cluster.MainnetBeta;
  }
}

const ModalContext = createContext<[boolean, SetShowModal] | undefined>(undefined);
const StateContext = createContext<State | undefined>(undefined);
const DispatchContext = createContext<Dispatch | undefined>(undefined);

const WHITELISTED_RPCS = [
  // Used for solana.com live code example
  'engine.mirror.ad',
];

// Track last error to prevent spam
const lastErrorCache = new Map<string, number>();
const ERROR_DEBOUNCE_MS = 5000; // Only log same error once per 5 seconds

function isWhitelistedRpc(url: string) {
  try {
    return WHITELISTED_RPCS.includes(new URL(url).hostname);
  } catch (e) {
    return false;
  }
}

function shouldLogError(errorKey: string): boolean {
  const now = Date.now();
  const lastLogged = lastErrorCache.get(errorKey);
  if (!lastLogged || now - lastLogged > ERROR_DEBOUNCE_MS) {
    lastErrorCache.set(errorKey, now);
    return true;
  }
  return false;
}

type ClusterProviderProps = { children: React.ReactNode };
export function ClusterProvider({ children }: ClusterProviderProps) {
  const [state, dispatch] = useReducer(clusterReducer, {
    cluster: DEFAULT_CLUSTER,
    customUrl: DEFAULT_CUSTOM_URL,
    status: ClusterStatus.Connecting,
  });
  const modalState = useState(false);
  const searchParams = useSearchParams();
  const cluster = parseQuery(searchParams);
  const enableCustomUrl =
    (localStorageIsAvailable() && localStorage.getItem('enableCustomUrl') !== null) ||
    isWhitelistedRpc(state.customUrl);
  const customUrl = (enableCustomUrl && searchParams?.get('customUrl')) || state.customUrl;
  const pathname = usePathname();
  const router = useRouter();

  // Remove customUrl param if dev setting is disabled
  useEffect(() => {
    if (!enableCustomUrl && searchParams?.has('customUrl')) {
      const newSearchParams = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (key === 'customUrl') {
          return;
        }
        newSearchParams.set(key, value);
      });
      const nextQueryString = newSearchParams.toString();
      router.push(`${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`);
    }
  }, [enableCustomUrl]); // eslint-disablline react-hooks/exhaustivdeps

  // Restore last selected cluster from localStorage
  useEffect(() => {
    // Only run on client and if no cluster param is present (defaulting to mainnet)
    if (localStorageIsAvailable() && !searchParams?.has('cluster')) {
      try {
        const lastCluster = localStorage.getItem('explorer-last-cluster');
        if (lastCluster && lastCluster !== 'mainnet-beta') {
          const nextSearchParams = new URLSearchParams(searchParams?.toString() || '');
          nextSearchParams.set('cluster', lastCluster);
          const nextQueryString = nextSearchParams.toString();
          router.replace(`${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`);
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, []); // Run once on mount

  // Reconnect to cluster when params change
  useEffect(() => {
    updateCluster(dispatch, cluster, customUrl);
  }, [cluster, customUrl]); // eslint-disablline react-hooks/exhaustivdeps

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        <ModalContext.Provider value={modalState}>{children}</ModalContext.Provider>
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

async function updateCluster(dispatch: Dispatch, cluster: Cluster, customUrl: string) {
  dispatch({
    cluster,
    customUrl,
    status: ClusterStatus.Connecting,
  });

  try {
    // Determine transport URL first
    const transportUrl = clusterUrl(cluster, customUrl);

    if (!transportUrl) {
      throw new Error(`Failed to determine RPC URL for cluster: ${clusterName(cluster)}`);
    }

    // Validate URL format for custom clusters
    if (cluster === Cluster.Custom) {
      try {
        const urlObj = new URL(transportUrl);
        // Ensure it's http or https
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          throw new Error(`Invalid protocol: ${urlObj.protocol}. Must be http: or https:`);
        }
      } catch (urlError) {
        const message = urlError instanceof Error ? urlError.message : String(urlError);
        throw new Error(`Invalid Custom RPC URL "${transportUrl}": ${message}`);
      }
    }

    const rpc = createSolanaRpc(transportUrl);

    const [firstAvailableBlock, epochSchedule, epochInfo] = await Promise.all([
      rpc.getFirstAvailableBlock().send(),
      rpc.getEpochSchedule().send(),
      rpc.getEpochInfo().send(),
    ]);

    dispatch({
      cluster,
      clusterInfo: {
        epochInfo,
        // These are incorrectly typed as unknown
        // See https://github.com/solana-labs/solana-web3.js/issues/1389
        epochSchedule: epochSchedule as EpochSchedule,
        firstAvailableBlock: firstAvailableBlock as bigint,
      },
      customUrl,
      status: ClusterStatus.Connected,
    });
  } catch (error) {
    const transportUrl = clusterUrl(cluster, customUrl);

    // Extract detailed error information with comprehensive logging
    let errorMessage = 'Unknown error';
    let errorType = 'UnknownError';
    let errorStack: string | undefined;
    let errorDetails: Record<string, unknown> = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorType = error.name;
      errorStack = error.stack;

      // Extract all properties (both enumerable and non-enumerable)
      const allKeys = [...Object.getOwnPropertyNames(error), ...Object.keys(error)];

      // Remove duplicates
      const uniqueKeys = [...new Set(allKeys)];

      errorDetails = uniqueKeys.reduce(
        (acc, key) => {
          try {
            const value = (error as any)[key];

            // Handle different value types
            if (typeof value === 'function') {
              acc[key] = '[Function]';
            } else if (value === null) {
              acc[key] = null;
            } else if (value === undefined) {
              acc[key] = undefined;
            } else if (typeof value === 'object') {
              // Try to serialize objects safely
              try {
                acc[key] = JSON.parse(JSON.stringify(value));
              } catch {
                // If circular reference or unserializable, use string representation
                acc[key] = Object.prototype.toString.call(value);
              }
            } else {
              acc[key] = value;
            }
          } catch {
            acc[key] = '[Unreadable]';
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );

      // Also check prototype chain for custom error properties
      let proto = Object.getPrototypeOf(error);
      while (proto && proto !== Error.prototype && proto !== Object.prototype) {
        Object.getOwnPropertyNames(proto).forEach(key => {
          if (key !== 'constructor' && !(key in errorDetails)) {
            try {
              const value = (error as any)[key];
              if (typeof value !== 'function') {
                errorDetails[`proto_${key}`] = value;
              }
            } catch {
              // Ignore unreadable prototype properties
            }
          }
        });
        proto = Object.getPrototypeOf(proto);
      }
    } else if (typeof error === 'object' && error !== null) {
      // Handle non-Error objects
      try {
        errorMessage = JSON.stringify(error);
        errorDetails = { ...error } as Record<string, unknown>;
      } catch {
        errorMessage = String(error);
        errorDetails = { stringValue: String(error) };
      }
      errorType = 'ObjectError';
    } else {
      errorMessage = String(error);
      errorDetails = { primitiveValue: error };
    }

    // Create a safe error log object (avoid circular references)
    const errorLog = {
      cluster: clusterName(cluster),
      url: transportUrl,
      isCustom: cluster === Cluster.Custom,
      errorType,
      errorMessage: errorMessage.substring(0, 200), // Truncate long messages
    };

    // Create unique key for this error to prevent spam
    const errorKey = `${cluster}-${errorType}-${errorMessage.substring(0, 50)}`;

    // Only log in development and if not recently logged
    const isDev = process.env.NODE_ENV === 'development';
    const shouldLog = isDev && shouldLogError(errorKey);

    // Provide more informative error messages (but only log once per error type)
    if (shouldLog) {
      if (errorMessage.includes('<!DOCTYPE') || errorMessage.includes('not valid JSON')) {
        console.warn('⚠️ RPC endpoint returned HTML instead of JSON (not a valid Solana RPC)', errorLog);
      } else if (
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('ECONNREFUSED')
      ) {
        console.warn('⚠️ Network error connecting to RPC', {
          cluster: errorLog.cluster,
          url: errorLog.url,
          hint:
            cluster === Cluster.Custom
              ? 'Check that the RPC URL is correct and accessible'
              : 'Check your internet connection or try switching clusters',
        });
      } else {
        console.warn('⚠️ Failed to connect to cluster', errorLog);
      }
    }

    dispatch({
      cluster,
      customUrl,
      status: ClusterStatus.Failure,
    });
  }
}

export function useUpdateCustomUrl() {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) {
    throw new Error(`useUpdateCustomUrl must be used within a ClusterProvider`);
  }

  return (customUrl: string) => {
    updateCluster(dispatch, Cluster.Custom, customUrl);
  };
}

export function useCluster() {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error(`useCluster must be used within a ClusterProvider`);
  }
  return {
    ...context,
    name: clusterName(context.cluster),
    url: clusterUrl(context.cluster, context.customUrl),
  };
}

export function useClusterModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error(`useClusterModal must be used within a ClusterProvider`);
  }
  return context;
}
