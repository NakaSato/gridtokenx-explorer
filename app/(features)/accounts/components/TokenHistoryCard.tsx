'use client';

import { ErrorCard } from '@/app/(shared)/components/ErrorCard';
import { LoadingCard } from '@/app/(shared)/components/LoadingCard';
import { Button } from '@/app/(shared)/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/(shared)/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/(shared)/components/ui/table';
import { TokenInfoWithPubkey, useAccountOwnedTokens } from '@/app/(core)/providers/accounts/tokens';
import { useCluster } from '@/app/(core)/providers/cluster';
import { useTransactionDetailsCache } from '@/app/(core)/providers/transactions/parsed';
import { Cluster } from '@/app/(shared)/utils/cluster';
import { displayAddress } from '@/app/(shared)/utils/tx';
import Link from 'next/link';
import React from 'react';
import { ChevronDown, RefreshCw } from 'react-feather';
import { ALL_TOKENS, useTokenHistory } from '../hooks/useTokenHistory';
import { TokenHistoryRow } from './TokenHistoryRow';

const TRUNCATE_TOKEN_LENGTH = 10;

export function TokenHistoryCard({ address }: { address: string }) {
  const ownedTokens = useAccountOwnedTokens(address);

  if (ownedTokens === undefined) {
    return null;
  }

  const tokens = ownedTokens.data?.tokens;
  if (tokens === undefined || tokens.length === 0) return null;

  if (tokens.length > 25) {
    return <ErrorCard text="Token transaction history is not available for accounts with over 25 token accounts" />;
  }

  return <TokenHistoryTable tokens={tokens} />;
}

type FilterProps = {
  filter: string;
  toggle: () => void;
  show: boolean;
  tokens: TokenInfoWithPubkey[];
  buildLocation: (filter: string) => string;
};

function TokenHistoryTable({ tokens }: { tokens: TokenInfoWithPubkey[] }) {
  const transactionDetailsCache = useTransactionDetailsCache();

  const {
    allFoundOldest,
    buildLocation,
    failed,
    fetchHistories,
    fetching,
    filter,
    mintAndTxs,
    setDropdown,
    showDropdown,
  } = useTokenHistory(tokens);

  if (mintAndTxs.length === 0) {
    if (fetching) {
      return <LoadingCard message="Loading history" />;
    } else if (failed) {
      return <ErrorCard retry={() => fetchHistories(true)} text="Failed to fetch transaction history" />;
    }
    return <ErrorCard retry={() => fetchHistories(true)} retryText="Try again" text="No transaction history found" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Token History</CardTitle>
          <div className="flex items-center gap-2">
            <FilterDropdown
              filter={filter}
              toggle={() => setDropdown(show => !show)}
              show={showDropdown}
              tokens={tokens}
              buildLocation={buildLocation}
            />
            <Button variant="outline" size="sm" disabled={fetching} onClick={() => fetchHistories(true)}>
              {fetching ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-pulse rounded-full bg-current"></span>
                  Loading
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2" size={13} />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1">Slot</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Instruction Type</TableHead>
              <TableHead>Transaction Signature</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mintAndTxs.map(({ mint, tx }) => (
              <TokenHistoryRow
                key={tx.signature}
                mint={mint}
                tx={tx}
                details={transactionDetailsCache[tx.signature]}
              />
            ))}
          </TableBody>
        </Table>

        <div className="border-t px-6 py-4">
          {allFoundOldest ? (
            <div className="text-muted-foreground text-center">Fetched full history</div>
          ) : (
            <Button className="w-full" onClick={() => fetchHistories()} disabled={fetching}>
              {fetching ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-pulse rounded-full bg-current"></span>
                  Loading
                </>
              ) : (
                'Load More'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const FilterDropdown = ({ filter, toggle, show, tokens, buildLocation }: FilterProps) => {
  const { cluster } = useCluster();

  const filterOptions: string[] = [ALL_TOKENS];
  const nameLookup: Map<string, string> = new Map();

  tokens.forEach(token => {
    const address = token.info.mint.toBase58();
    if (!nameLookup.has(address)) {
      filterOptions.push(address);
      nameLookup.set(address, formatTokenName(address, cluster, token));
    }
  });

  return (
    <DropdownMenu open={show} onOpenChange={toggle}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {filter === ALL_TOKENS ? 'All Tokens' : nameLookup.get(filter)} <ChevronDown size={15} className="ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {filterOptions.map(filterOption => (
          <DropdownMenuItem key={filterOption} asChild>
            <Link
              href={buildLocation(filterOption)}
              className={filterOption === filter ? 'font-semibold' : ''}
              onClick={toggle}
            >
              {filterOption === ALL_TOKENS ? 'All Tokens' : nameLookup.get(filterOption) || filterOption}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function formatTokenName(pubkey: string, cluster: Cluster, tokenInfo: TokenInfoWithPubkey): string {
  let display = displayAddress(pubkey, cluster, tokenInfo);

  if (display === pubkey) {
    display = display.slice(0, TRUNCATE_TOKEN_LENGTH) + '\u2026';
  }

  return display;
}
