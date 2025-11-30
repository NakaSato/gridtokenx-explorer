import { useAccountHistories, useFetchAccountHistory } from '@/app/(core)/providers/accounts/history';
import { TokenInfoWithPubkey } from '@/app/(core)/providers/accounts/tokens';
import { FetchStatus } from '@/app/(core)/providers/cache';
import { ConfirmedSignatureInfo, PublicKey } from '@solana/web3.js';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useCallback } from 'react';

export const ALL_TOKENS = '';

export type TokenTransaction = {
  mint: PublicKey;
  tx: ConfirmedSignatureInfo;
};

const useQueryFilter = (): string => {
  const searchParams = useSearchParams();
  const filter = searchParams?.get('filter');
  return filter || '';
};

export function useTokenHistory(tokens: TokenInfoWithPubkey[]) {
  const accountHistories = useAccountHistories();
  const fetchAccountHistory = useFetchAccountHistory();
  const [showDropdown, setDropdown] = React.useState(false);
  const filter = useQueryFilter();
  const currentSearchParams = useSearchParams();
  const currentPathname = usePathname();

  const filteredTokens = React.useMemo(
    () =>
      tokens.filter(token => {
        if (filter === ALL_TOKENS) {
          return true;
        }
        return token.info.mint.toBase58() === filter;
      }),
    [tokens, filter],
  );

  const fetchHistories = React.useCallback(
    (refresh?: boolean) => {
      filteredTokens.forEach(token => {
        fetchAccountHistory(token.pubkey, refresh);
      });
    },
    [filteredTokens, fetchAccountHistory],
  );

  // Fetch histories on load
  React.useEffect(() => {
    filteredTokens.forEach(token => {
      const address = token.pubkey.toBase58();
      if (!accountHistories[address]) {
        fetchAccountHistory(token.pubkey, true);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allFoundOldest = filteredTokens.every(token => {
    const history = accountHistories[token.pubkey.toBase58()];
    return history?.data?.foundOldest === true;
  });

  const allFetchedSome = filteredTokens.every(token => {
    const history = accountHistories[token.pubkey.toBase58()];
    return history?.data !== undefined;
  });

  // Find the oldest slot which we know we have the full history for
  let oldestSlot: number | undefined = allFoundOldest ? 0 : undefined;

  if (!allFoundOldest && allFetchedSome) {
    filteredTokens.forEach(token => {
      const history = accountHistories[token.pubkey.toBase58()];
      if (history?.data?.foundOldest === false) {
        const earliest = history.data.fetched[history.data.fetched.length - 1].slot;
        if (!oldestSlot) oldestSlot = earliest;
        oldestSlot = Math.max(oldestSlot, earliest);
      }
    });
  }

  const fetching = filteredTokens.some(token => {
    const history = accountHistories[token.pubkey.toBase58()];
    return history?.status === FetchStatus.Fetching;
  });

  const failed = filteredTokens.some(token => {
    const history = accountHistories[token.pubkey.toBase58()];
    return history?.status === FetchStatus.FetchFailed;
  });

  const sigSet = new Set();
  const mintAndTxs = filteredTokens
    .map(token => ({
      history: accountHistories[token.pubkey.toBase58()],
      mint: token.info.mint,
    }))
    .filter(({ history }) => {
      return history?.data?.fetched && history.data.fetched.length > 0;
    })
    .flatMap(({ mint, history }) =>
      (history?.data?.fetched as ConfirmedSignatureInfo[]).map(tx => ({
        mint,
        tx,
      })),
    )
    .filter(({ tx }) => {
      if (sigSet.has(tx.signature)) return false;
      sigSet.add(tx.signature);
      return true;
    })
    .filter(({ tx }) => {
      return oldestSlot !== undefined && tx.slot >= oldestSlot;
    });

  React.useEffect(() => {
    if (!fetching && mintAndTxs.length < 1 && !allFoundOldest) {
      fetchHistories();
    }
  }, [fetching, mintAndTxs, allFoundOldest, fetchHistories]);

  mintAndTxs.sort((a, b) => {
    if (a.tx.slot > b.tx.slot) return -1;
    if (a.tx.slot < b.tx.slot) return 1;
    return 0;
  });

  const buildLocation = useCallback(
    (filter: string) => {
      const params = new URLSearchParams(currentSearchParams?.toString());
      if (filter === ALL_TOKENS) {
        params.delete('filter');
      } else {
        params.set('filter', filter);
      }
      const nextQueryString = params.toString();
      return `${currentPathname}${nextQueryString ? `?${nextQueryString}` : ''}`;
    },
    [currentPathname, currentSearchParams],
  );

  return {
    allFoundOldest,
    buildLocation,
    failed,
    fetchHistories,
    fetching,
    filter,
    mintAndTxs,
    setDropdown,
    showDropdown,
  };
}
