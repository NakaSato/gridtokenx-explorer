'use client';

import { useAccountInfo, useFetchAccountInfo } from '@/app/(core)/providers/accounts';
import * as Cache from '@/app/(core)/providers/cache';
import { ActionType, FetchStatus } from '@/app/(core)/providers/cache';
import { useCluster } from '@/app/(core)/providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { Cluster } from '@/app/(shared)/utils/cluster';
import { createRpc, toAddress, addressToPublicKey } from '@/app/(shared)/utils/rpc';
import { TokenAccountInfo } from '@/app/validators/accounts/token';
import React from 'react';
import { create } from 'superstruct';

import { getCurrentTokenScaledUiAmountMultiplier, getTokenInfos } from '@/app/(shared)/utils/token-info';
import { MintAccountInfo } from '@/app/validators/accounts/token';

export type TokenInfoWithPubkey = {
  info: TokenAccountInfo;
  pubkey: PublicKey;
  logoURI?: string;
  symbol?: string;
  name?: string;
};

interface AccountTokens {
  tokens?: TokenInfoWithPubkey[];
}

type State = Cache.State<AccountTokens>;
type Dispatch = Cache.Dispatch<AccountTokens>;

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type ProviderProps = { children: React.ReactNode };
export function TokensProvider({ children }: ProviderProps) {
  const { url } = useCluster();
  const [state, dispatch] = Cache.useReducer<AccountTokens>(url);

  React.useEffect(() => {
    dispatch({ type: ActionType.Clear, url });
  }, [dispatch, url]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
export function isTokenProgramId(programId: PublicKey) {
  return programId.equals(TOKEN_PROGRAM_ID) || programId.equals(TOKEN_2022_PROGRAM_ID);
}

async function fetchAccountTokens(dispatch: Dispatch, pubkey: PublicKey, cluster: Cluster, url: string) {
  const key = pubkey.toBase58();
  dispatch({
    key,
    status: FetchStatus.Fetching,
    type: ActionType.Update,
    url,
  });

  let status;
  let data;
  try {
    const rpc = createRpc(url);
    const address = toAddress(pubkey);

    // Fetch token accounts for both TOKEN_PROGRAM_ID and TOKEN_2022_PROGRAM_ID
    const [tokenAccountsResponse, token2022AccountsResponse] = await Promise.all([
      rpc
        .getTokenAccountsByOwner(address, { programId: toAddress(TOKEN_PROGRAM_ID) }, { encoding: 'jsonParsed' })
        .send(),
      rpc
        .getTokenAccountsByOwner(address, { programId: toAddress(TOKEN_2022_PROGRAM_ID) }, { encoding: 'jsonParsed' })
        .send(),
    ]);

    // Combine and convert token accounts
    const allAccounts = [...Array.from(tokenAccountsResponse.value), ...Array.from(token2022AccountsResponse.value)];

    const tokens: TokenInfoWithPubkey[] = allAccounts.slice(0, 101).map(accountInfo => {
      const parsedInfo = accountInfo.account.data.parsed.info;
      const info = create(parsedInfo, TokenAccountInfo);
      return {
        info,
        pubkey: addressToPublicKey(accountInfo.pubkey),
      };
    });

    // Fetch symbols and logos for tokens
    const tokenMintInfos = await getTokenInfos(
      tokens.map(t => t.info.mint),
      cluster,
      url,
    );
    if (tokenMintInfos) {
      const mappedTokenInfos = Object.fromEntries(
        tokenMintInfos.map(t => [
          t.address,
          {
            logoURI: t.logoURI,
            name: t.name,
            symbol: t.symbol,
          },
        ]),
      );
      tokens.forEach(t => {
        const tokenInfo = mappedTokenInfos[t.info.mint.toString()];
        if (tokenInfo) {
          t.logoURI = tokenInfo.logoURI ?? undefined;
          t.symbol = tokenInfo.symbol;
          t.name = tokenInfo.name;
        }
      });
    }

    data = {
      tokens,
    };
    status = FetchStatus.Fetched;
  } catch (error) {
    if (cluster !== Cluster.Custom) {
      console.error(error, { url });
    }
    status = FetchStatus.FetchFailed;
  }
  dispatch({ data, key, status, type: ActionType.Update, url });
}

export function useAccountOwnedTokens(address: string): Cache.CacheEntry<AccountTokens> | undefined {
  const context = React.useContext(StateContext);

  if (!context) {
    throw new Error(`useAccountOwnedTokens must be used within a AccountsProvider`);
  }

  return context.entries[address];
}

export function useFetchAccountOwnedTokens() {
  const dispatch = React.useContext(DispatchContext);
  if (!dispatch) {
    throw new Error(`useFetchAccountOwnedTokens must be used within a AccountsProvider`);
  }

  const { cluster, url } = useCluster();
  return React.useCallback(
    (pubkey: PublicKey) => {
      fetchAccountTokens(dispatch, pubkey, cluster, url);
    },
    [dispatch, cluster, url],
  );
}

export function useScaledUiAmountForMint(address: string | undefined, rawAmount: string): [string, string] {
  const mint = useAccountInfo(address);
  const refresh = useFetchAccountInfo();

  React.useEffect(() => {
    if (address && !mint) {
      refresh(new PublicKey(address), 'parsed');
    }
  }, [address, refresh, mint]);

  if (!mint) {
    return [rawAmount, '1'];
  }

  const infoParsed = mint?.data?.data.parsed;
  const mintInfo = infoParsed && create(infoParsed?.parsed.info, MintAccountInfo);
  const scaledUiAmountMultiplier = getCurrentTokenScaledUiAmountMultiplier(mintInfo?.extensions);

  if (scaledUiAmountMultiplier === '1') {
    return [rawAmount, '1'];
  }

  return [(Number(rawAmount) * Number(scaledUiAmountMultiplier)).toString(), scaledUiAmountMultiplier];
}
