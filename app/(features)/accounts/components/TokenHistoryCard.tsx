'use client';

import { Address } from '@/app/(shared)/components/common/Address';
import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { LoadingCard } from '@/app/(shared)/components/common/LoadingCard';
import { Signature } from '@/app/(shared)/components/common/Signature';
import { Slot } from '@/app/(shared)/components/common/Slot';
import { Button } from '@/app/(shared)/components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/shared/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/(shared)/components/shared/ui/dropdown-menu';
import { isMangoInstruction, parseMangoInstructionTitle } from '@/app/(shared)/components/instruction/mango/types';
import { isSerumInstruction, parseSerumInstructionTitle } from '@/app/(shared)/components/instruction/serum/types';
import {
  isTokenLendingInstruction,
  parseTokenLendingInstructionTitle,
} from '@/app/(shared)/components/instruction/token-lending/types';
import { isTokenSwapInstruction, parseTokenSwapInstructionTitle } from '@/app/(shared)/components/instruction/token-swap/types';
import { isTokenProgramData } from '@/app/(core)/providers/accounts';
import { useAccountHistories, useFetchAccountHistory } from '@/app/(core)/providers/accounts/history';
import { isTokenProgramId, TokenInfoWithPubkey, useAccountOwnedTokens } from '@/app/(core)/providers/accounts/tokens';
import { CacheEntry, FetchStatus } from '@/app/(core)/providers/cache';
import { useCluster } from '@/app/(core)/providers/cluster';
import { Details, useFetchTransactionDetails, useTransactionDetailsCache } from '@providers/transactions/parsed';
import { toAddress, addressToPublicKey } from '@/app/(shared)/utils/rpc';
import { ConfirmedSignatureInfo, ParsedInstruction, PartiallyDecodedInstruction, PublicKey } from '@solana/web3.js';
import { Cluster } from '@/app/(shared)/utils/cluster';
import { INNER_INSTRUCTIONS_START_SLOT } from '@/app/(shared)/utils/index';
import { getTokenProgramInstructionName } from '@/app/(shared)/utils/instruction';
import { displayAddress, intoTransactionInstruction } from '@/app/(shared)/utils/tx';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useCallback } from 'react';
import { ChevronDown, MinusSquare, PlusSquare, RefreshCw } from 'react-feather';

const TRUNCATE_TOKEN_LENGTH = 10;
const ALL_TOKENS = '';

type InstructionType = {
  name: string;
  innerInstructions: (ParsedInstruction | PartiallyDecodedInstruction)[];
};

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

const useQueryFilter = (): string => {
  const searchParams = useSearchParams();
  const filter = searchParams?.get('filter');
  return filter || '';
};

type FilterProps = {
  filter: string;
  toggle: () => void;
  show: boolean;
  tokens: TokenInfoWithPubkey[];
};

function TokenHistoryTable({ tokens }: { tokens: TokenInfoWithPubkey[] }) {
  const accountHistories = useAccountHistories();
  const fetchAccountHistory = useFetchAccountHistory();
  const transactionDetailsCache = useTransactionDetailsCache();
  const [showDropdown, setDropdown] = React.useState(false);
  const filter = useQueryFilter();

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
  }, []); // eslint-disablline react-hooks/exhaustivdeps

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

  if (mintAndTxs.length === 0) {
    if (fetching) {
      return <LoadingCard message="Loading history" />;
    } else if (failed) {
      return <ErrorCard retry={() => fetchHistories(true)} text="Failed to fetch transaction history" />;
    }
    return <ErrorCard retry={() => fetchHistories(true)} retryText="Try again" text="No transaction history found" />;
  }

  mintAndTxs.sort((a, b) => {
    if (a.tx.slot > b.tx.slot) return -1;
    if (a.tx.slot < b.tx.slot) return 1;
    return 0;
  });

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
        <div className="mb-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-muted-foreground w-1">Slot</th>
                <th className="text-muted-foreground">Result</th>
                <th className="text-muted-foreground">Token</th>
                <th className="text-muted-foreground">Instruction Type</th>
                <th className="text-muted-foreground">Transaction Signature</th>
              </tr>
            </thead>
            <tbody className="list">
              {mintAndTxs.map(({ mint, tx }) => (
                <TokenTransactionRow
                  key={tx.signature}
                  mint={mint}
                  tx={tx}
                  details={transactionDetailsCache[tx.signature]}
                />
              ))}
            </tbody>
          </table>
        </div>

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

const FilterDropdown = ({ filter, toggle, show, tokens }: FilterProps) => {
  const { cluster } = useCluster();
  const currentSearchParams = useSearchParams();
  const currentPathname = usePathname();
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

const TokenTransactionRow = React.memo(function TokenTransactionRow({
  mint,
  tx,
  details,
}: {
  mint: PublicKey;
  tx: ConfirmedSignatureInfo;
  details: CacheEntry<Details> | undefined;
}) {
  const fetchDetails = useFetchTransactionDetails();
  const { cluster } = useCluster();

  // Fetch details on load
  React.useEffect(() => {
    if (!details) fetchDetails(tx.signature);
  }, []); // eslint-disablline react-hooks/exhaustivdeps

  let statusText: string;
  let statusClass: string;
  if (tx.err) {
    statusClass = 'bg-yellow-100 text-yellow-800';
    statusText = 'Failed';
  } else {
    statusClass = 'bg-green-100 text-green-800';
    statusText = 'Success';
  }

  const transactionWithMeta = details?.data?.transactionWithMeta;
  const instructions = transactionWithMeta?.transaction.message.instructions;
  if (!instructions)
    return (
      <tr key={tx.signature}>
        <td className="w-1">
          <Slot slot={tx.slot} link />
        </td>

        <td>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
            {statusText}
          </span>
        </td>

        <td>
          <Address pubkey={mint} link truncate />
        </td>

        <td>
          <span className="mr-2 inline-block h-4 w-4 animate-pulse rounded-full bg-current align-text-top"></span>
          Loading
        </td>

        <td>
          <Signature signature={tx.signature} link />
        </td>
      </tr>
    );

  let tokenInstructionNames: InstructionType[] = [];

  if (transactionWithMeta) {
    tokenInstructionNames = instructions
      .map((ix, index): InstructionType | undefined => {
        let name = 'Unknown';

        const innerInstructions: (ParsedInstruction | PartiallyDecodedInstruction)[] = [];

        if (
          transactionWithMeta.meta?.innerInstructions &&
          (cluster !== Cluster.MainnetBeta || transactionWithMeta.slot >= INNER_INSTRUCTIONS_START_SLOT)
        ) {
          transactionWithMeta.meta.innerInstructions.forEach(ix => {
            if (ix.index === index) {
              ix.instructions.forEach(inner => {
                innerInstructions.push(inner);
              });
            }
          });
        }

        let transactionInstruction;
        if (transactionWithMeta?.transaction) {
          transactionInstruction = intoTransactionInstruction(transactionWithMeta.transaction, ix);
        }

        if ('parsed' in ix) {
          if (isTokenProgramData(ix)) {
            name = getTokenProgramInstructionName(ix, tx);
          } else {
            return undefined;
          }
        } else if (transactionInstruction && isSerumInstruction(transactionInstruction)) {
          try {
            name = parseSerumInstructionTitle(transactionInstruction);
          } catch (error) {
            console.error(error, { signature: tx.signature });
            return undefined;
          }
        } else if (transactionInstruction && isTokenSwapInstruction(transactionInstruction)) {
          try {
            name = parseTokenSwapInstructionTitle(transactionInstruction);
          } catch (error) {
            console.error(error, { signature: tx.signature });
            return undefined;
          }
        } else if (transactionInstruction && isTokenLendingInstruction(transactionInstruction)) {
          try {
            name = parseTokenLendingInstructionTitle(transactionInstruction);
          } catch (error) {
            console.error(error, { signature: tx.signature });
            return undefined;
          }
        } else if (transactionInstruction && isMangoInstruction(transactionInstruction)) {
          try {
            name = parseMangoInstructionTitle(transactionInstruction);
          } catch (error) {
            console.error(error, { signature: tx.signature });
            return undefined;
          }
        } else {
          if (ix.accounts.findIndex(account => isTokenProgramId(account)) >= 0) {
            name = 'Unknown (Inner)';
          } else {
            return undefined;
          }
        }

        return {
          innerInstructions,
          name,
        };
      })
      .filter(name => name !== undefined) as InstructionType[];
  }

  return (
    <>
      {tokenInstructionNames.map((instructionType, index) => {
        return (
          <tr key={index}>
            <td className="w-1">
              <Slot slot={tx.slot} link />
            </td>

            <td>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                {statusText}
              </span>
            </td>

            <td className="forced-truncate">
              <Address pubkey={mint} link truncateUnknown fetchTokenLabelInfo />
            </td>

            <td>
              <InstructionDetails instructionType={instructionType} tx={tx} />
            </td>

            <td className="forced-truncate">
              <Signature signature={tx.signature} link truncate />
            </td>
          </tr>
        );
      })}
    </>
  );
});

function InstructionDetails({ instructionType, tx }: { instructionType: InstructionType; tx: ConfirmedSignatureInfo }) {
  const [expanded, setExpanded] = React.useState(false);

  const instructionTypes = instructionType.innerInstructions
    .map(ix => {
      if ('parsed' in ix && isTokenProgramData(ix)) {
        return getTokenProgramInstructionName(ix, tx);
      }
      return undefined;
    })
    .filter(type => type !== undefined);

  return (
    <>
      <p className="tree">
        {instructionTypes.length > 0 && (
          <span
            onClick={e => {
              e.preventDefault();
              setExpanded(!expanded);
            }}
            className="mr-2 cursor-pointer"
          >
            {expanded ? (
              <MinusSquare className="align-text-top" size={13} />
            ) : (
              <PlusSquare className="align-text-top" size={13} />
            )}
          </span>
        )}
        {instructionType.name}
      </p>
      {expanded && (
        <ul className="tree">
          {instructionTypes.map((type, index) => {
            return <li key={index}>{type}</li>;
          })}
        </ul>
      )}
    </>
  );
}

function formatTokenName(pubkey: string, cluster: Cluster, tokenInfo: TokenInfoWithPubkey): string {
  let display = displayAddress(pubkey, cluster, tokenInfo);

  if (display === pubkey) {
    display = display.slice(0, TRUNCATE_TOKEN_LENGTH) + '\u2026';
  }

  return display;
}
