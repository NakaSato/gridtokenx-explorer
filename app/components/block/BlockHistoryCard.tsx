import { Address as AddressComponent } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { Signature } from '@components/common/Signature';
import { SolBalance } from '@components/common/SolBalance';
import { Button } from '@components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/shared/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@components/shared/ui/dropdown-menu';
import { StatusBadge } from '@components/shared/StatusBadge';
import { useCluster } from '@providers/cluster';
import { toAddress, addressToPublicKey } from '@utils/rpc';
import {
    ConfirmedTransactionMeta,
    PublicKey,
    TransactionSignature,
    VersionedBlockResponse,
    VOTE_PROGRAM_ID,
} from '@solana/web3.js';
import { parseProgramLogs } from '@utils/program-logs';
import { displayAddress } from '@utils/tx';
import { pickClusterParams } from '@utils/url';
import Link from 'next/link';
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo } from 'react';
import { ChevronDown } from 'react-feather';

import { estimateRequestedComputeUnits } from '@/app/utils/compute-units-schedule';

const PAGE_SIZE = 25;

const useQueryProgramFilter = (query: ReadonlyURLSearchParams): string => {
    const filter = query.get('filter');
    return filter || '';
};

const useQueryAccountFilter = (query: ReadonlyURLSearchParams): string | null => {
    const filter = query.get('accountFilter');
    if (filter !== null) {
        try {
            // Validate it's a valid address
            toAddress(filter);
            return filter;
        } catch {
            /* empty */
        }
    }
    return null;
};

type SortMode = 'index' | 'compute' | 'txnCost' | 'fee' | 'reservedCUs';
const useQuerySort = (query: ReadonlyURLSearchParams): SortMode => {
    const sort = query.get('sort');
    if (sort === 'compute') return 'compute';
    if (sort === 'txnCost') return 'txnCost';
    if (sort === 'fee') return 'fee';
    if (sort === 'reservedCUs') return 'reservedCUs';
    return 'index';
};

type TransactionWithInvocations = {
    index: number;
    signature?: TransactionSignature;
    meta: ConfirmedTransactionMeta | null;
    invocations: Map<string, number>;
    computeUnits?: number;
    costUnits?: number;
    reservedComputeUnits?: number;
    logTruncated: boolean;
};

export function BlockHistoryCard({ block, epoch }: { block: VersionedBlockResponse; epoch: bigint | undefined }) {
    const [numDisplayed, setNumDisplayed] = React.useState(PAGE_SIZE);
    const currentPathname = usePathname();
    const currentSearchParams = useSearchParams();
    const programFilter = useQueryProgramFilter(currentSearchParams);
    const accountFilter = useQueryAccountFilter(currentSearchParams);
    const sortMode = useQuerySort(currentSearchParams);
    const router = useRouter();
    const { cluster } = useCluster();

    const { transactions, invokedPrograms } = React.useMemo(() => {
        const invokedPrograms = new Map<string, number>();

        const transactions: TransactionWithInvocations[] = block.transactions.map((tx, index) => {
            let signature: TransactionSignature | undefined;
            if (tx.transaction.signatures.length > 0) {
                signature = tx.transaction.signatures[0];
            }

            const programIndexes = tx.transaction.message.compiledInstructions
                .map(ix => ix.programIdIndex)
                .concat(
                    tx.meta?.innerInstructions?.flatMap(ix => {
                        return ix.instructions.map(ix => ix.programIdIndex);
                    }) || [],
                );

            const indexMap = new Map<number, number>();
            programIndexes.forEach(programIndex => {
                const count = indexMap.get(programIndex) || 0;
                indexMap.set(programIndex, count + 1);
            });

            const invocations = new Map<string, number>();
            const accountKeys = tx.transaction.message.getAccountKeys({
                accountKeysFromLookups: tx.meta?.loadedAddresses,
            });
            indexMap.forEach((count, i) => {
                const programId = accountKeys.get(i)!.toBase58();
                invocations.set(programId, count);
                const programTransactionCount = invokedPrograms.get(programId) || 0;
                invokedPrograms.set(programId, programTransactionCount + 1);
            });

            let logTruncated = false;
            let computeUnits: number | undefined = undefined;
            try {
                const parsedLogs = parseProgramLogs(tx.meta?.logMessages ?? [], tx.meta?.err ?? null, cluster);

                logTruncated = parsedLogs[parsedLogs.length - 1].truncated;
                computeUnits = parsedLogs.map(({ computeUnits }) => computeUnits).reduce((sum, next) => sum + next);
            } catch (err) {
                // ignore parsing errors because some old logs aren't parsable
            }

            let costUnits: number | undefined = undefined;
            try {
                costUnits = tx.meta?.costUnits ?? 0;
            } catch (err) {
                // ignore parsing errors because some old logs aren't parsable
            }

            // Calculate reserved compute units
            const reservedComputeUnits = estimateRequestedComputeUnits(tx, epoch, cluster);

            return {
                computeUnits,
                costUnits,
                index,
                invocations,
                logTruncated,
                meta: tx.meta,
                reservedComputeUnits,
                signature,
            };
        });
        return { invokedPrograms, transactions };
    }, [block, cluster, epoch]);

    const [filteredTransactions, showComputeUnits] = React.useMemo((): [TransactionWithInvocations[], boolean] => {
        const voteFilter = VOTE_PROGRAM_ID.toBase58();
        const filteredTxs: TransactionWithInvocations[] = transactions
            .filter(({ invocations }) => {
                if (programFilter === ALL_TRANSACTIONS) {
                    return true;
                } else if (programFilter === HIDE_VOTES) {
                    // hide vote txs that don't invoke any other programs
                    return !(invocations.has(voteFilter) && invocations.size === 1);
                }
                return invocations.has(programFilter);
            })
            .filter(({ index }) => {
                if (accountFilter === null) {
                    return true;
                }

                const tx = block.transactions[index];
                const accountKeys = tx.transaction.message.getAccountKeys({
                    accountKeysFromLookups: tx.meta?.loadedAddresses,
                });
                return accountKeys
                    .keySegments()
                    .flat()
                    .find(key => key.toBase58() === accountFilter);
            });

        const showComputeUnits = filteredTxs.every(tx => tx.computeUnits !== undefined);

        if (sortMode === 'compute' && showComputeUnits) {
            filteredTxs.sort((a, b) => b.computeUnits! - a.computeUnits!);
        } else if (sortMode === 'txnCost') {
            filteredTxs.sort((a, b) => b.costUnits! - a.costUnits!);
        } else if (sortMode === 'fee') {
            filteredTxs.sort((a, b) => (b.meta?.fee || 0) - (a.meta?.fee || 0));
        } else if (sortMode === 'reservedCUs') {
            filteredTxs.sort((a, b) => (b.reservedComputeUnits || 0) - (a.reservedComputeUnits || 0));
        }

        return [filteredTxs, showComputeUnits];
    }, [block.transactions, transactions, programFilter, accountFilter, sortMode]);

    if (transactions.length === 0) {
        return <ErrorCard text="This block has no transactions" />;
    }

    let title: string;
    if (filteredTransactions.length === transactions.length) {
        title = `Block Transactions (${filteredTransactions.length})`;
    } else {
        title = `Filtered Block Transactions (${filteredTransactions.length}/${transactions.length})`;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{title}</CardTitle>
                    <FilterDropdown
                        filter={programFilter}
                        invokedPrograms={invokedPrograms}
                        totalTransactionCount={transactions.length}
                    />
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {accountFilter !== null && (
                    <div className="p-6">
                        Showing transactions which load account:
                        <div className="ml-2 inline-block">
                            <AddressComponent pubkey={addressToPublicKey(toAddress(accountFilter))} link />
                        </div>
                    </div>
                )}

                {filteredTransactions.length === 0 ? (
                    <div className="p-6">
                        {accountFilter === null && programFilter === HIDE_VOTES
                            ? "This block doesn't contain any non-vote transactions"
                            : 'No transactions found with this filter'}
                    </div>
                ) : (
                    <div className="mb-0 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th
                                    className="text-muted-foreground cursor-pointer"
                                    onClick={() => {
                                        const additionalParams = new URLSearchParams(currentSearchParams?.toString());
                                        additionalParams.delete('sort');
                                        router.push(
                                            pickClusterParams(currentPathname, currentSearchParams, additionalParams),
                                        );
                                    }}
                                >
                                    #
                                </th>
                                <th className="text-muted-foreground">Result</th>
                                <th className="text-muted-foreground">Transaction Signature</th>
                                <th
                                    className="text-muted-foreground cursor-pointer"
                                    onClick={() => {
                                        const additionalParams = new URLSearchParams(currentSearchParams?.toString());
                                        additionalParams.set('sort', 'fee');
                                        router.push(
                                            pickClusterParams(currentPathname, currentSearchParams, additionalParams),
                                        );
                                    }}
                                >
                                    Fee
                                </th>
                                <th
                                    className="text-muted-foreground cursor-pointer"
                                    onClick={() => {
                                        const additionalParams = new URLSearchParams(currentSearchParams?.toString());
                                        additionalParams.set('sort', 'reservedCUs');
                                        router.push(
                                            pickClusterParams(currentPathname, currentSearchParams, additionalParams),
                                        );
                                    }}
                                >
                                    Reserved CUs
                                </th>
                                {showComputeUnits && (
                                    <th
                                        className="text-muted-foreground cursor-pointer"
                                        onClick={() => {
                                            const additionalParams = new URLSearchParams(
                                                currentSearchParams?.toString(),
                                            );
                                            additionalParams.set('sort', 'compute');
                                            router.push(
                                                pickClusterParams(
                                                    currentPathname,
                                                    currentSearchParams,
                                                    additionalParams,
                                                ),
                                            );
                                        }}
                                    >
                                        Compute
                                    </th>
                                )}
                                <th
                                    className="text-muted-foreground cursor-pointer"
                                    onClick={() => {
                                        const additionalParams = new URLSearchParams(currentSearchParams?.toString());
                                        additionalParams.set('sort', 'txnCost');
                                        router.push(
                                            pickClusterParams(currentPathname, currentSearchParams, additionalParams),
                                        );
                                    }}
                                >
                                    Txn Cost
                                </th>
                                <th className="text-muted-foreground">Invoked Programs</th>
                            </tr>
                        </thead>
                        <tbody className="list">
                            {filteredTransactions.slice(0, numDisplayed).map((tx, i) => {
                                const isSuccess = !tx.meta?.err && tx.signature;
                                let signature: React.ReactNode;

                                if (tx.signature) {
                                    signature = <Signature signature={tx.signature} link truncateChars={32} />;
                                }

                                const entries = Array.from(tx.invocations.entries());
                                entries.sort();

                                return (
                                    <tr key={i}>
                                        <td>{tx.index + 1}</td>
                                        <td>
                                            <StatusBadge
                                                status={isSuccess ? 'success' : 'error'}
                                                label={isSuccess ? 'Success' : 'Failed'}
                                            />
                                        </td>

                                        <td>{signature}</td>

                                        <td>{tx.meta !== null ? <SolBalance lamports={tx.meta.fee} /> : 'Unknown'}</td>

                                        <td>
                                            {tx.reservedComputeUnits !== undefined
                                                ? new Intl.NumberFormat('en-US').format(tx.reservedComputeUnits)
                                                : 'Unknown'}
                                        </td>

                                        {showComputeUnits && (
                                            <td>
                                                {tx.logTruncated && '>'}
                                                {tx.computeUnits !== undefined
                                                    ? new Intl.NumberFormat('en-US').format(tx.computeUnits)
                                                    : 'Unknown'}
                                            </td>
                                        )}
                                        <td>
                                            {tx.costUnits !== undefined
                                                ? new Intl.NumberFormat('en-US').format(tx.costUnits)
                                                : 'Unknown'}
                                        </td>
                                        <td>
                                            {tx.invocations.size === 0
                                                ? 'NA'
                                                : entries.map(([programId, count], i) => {
                                                      return (
                                                          <div key={i} className="flex items-center">
                                                              <AddressComponent pubkey={addressToPublicKey(toAddress(programId))} link />
                                                              <span className="text-muted-foreground ml-2">{`(${count})`}</span>
                                                          </div>
                                                      );
                                                  })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredTransactions.length > numDisplayed && (
                <div className="border-t px-6 py-4">
                    <Button
                        className="w-full"
                        onClick={() => setNumDisplayed(displayed => displayed + PAGE_SIZE)}
                    >
                        Load More
                    </Button>
                </div>
            )}
            </CardContent>
        </Card>
    );
}

type FilterProps = {
    filter: string;
    invokedPrograms: Map<string, number>;
    totalTransactionCount: number;
};

const ALL_TRANSACTIONS = 'all';
const HIDE_VOTES = '';

type FilterOption = {
    name: string;
    programId: string;
    transactionCount: number;
};

const FilterDropdown = ({ filter, invokedPrograms, totalTransactionCount }: FilterProps) => {
    const { cluster } = useCluster();
    const defaultFilterOption: FilterOption = {
        name: 'All Except Votes',
        programId: HIDE_VOTES,
        transactionCount: totalTransactionCount - (invokedPrograms.get(VOTE_PROGRAM_ID.toBase58()) || 0),
    };

    const allTransactionsOption: FilterOption = {
        name: 'All Transactions',
        programId: ALL_TRANSACTIONS,
        transactionCount: totalTransactionCount,
    };

    let currentFilterOption = filter !== ALL_TRANSACTIONS ? defaultFilterOption : allTransactionsOption;

    const filterOptions: FilterOption[] = [defaultFilterOption, allTransactionsOption];

    invokedPrograms.forEach((transactionCount, programId) => {
        const name = displayAddress(programId, cluster);
        if (filter === programId) {
            currentFilterOption = {
                name: `${name} Transactions (${transactionCount})`,
                programId,
                transactionCount,
            };
        }
        filterOptions.push({ name, programId, transactionCount });
    });

    filterOptions.sort((a, b) => {
        if (a.transactionCount !== b.transactionCount) {
            return b.transactionCount - a.transactionCount;
        } else {
            return b.name > a.name ? -1 : 1;
        }
    });

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    {currentFilterOption.name} <ChevronDown className="ml-1" size={13} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-96 min-w-[200px] overflow-y-auto">
                {filterOptions.map(({ name, programId, transactionCount }) => (
                    <FilterLink
                        currentFilter={filter}
                        key={programId}
                        name={name}
                        programId={programId}
                        transactionCount={transactionCount}
                    />
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

function FilterLink({
    currentFilter,
    name,
    programId,
    transactionCount,
}: {
    currentFilter: string;
    name: string;
    programId: string;
    transactionCount: number;
}) {
    const currentSearchParams = useSearchParams();
    const currentPathname = usePathname();
    const href = useMemo(() => {
        const params = new URLSearchParams(currentSearchParams?.toString());
        if (name === HIDE_VOTES) {
            params.delete('filter');
        } else {
            params.set('filter', programId);
        }
        const nextQueryString = params.toString();
        return `${currentPathname}${nextQueryString ? `?${nextQueryString}` : ''}`;
    }, [currentPathname, currentSearchParams, name, programId]);
    return (
        <DropdownMenuItem asChild key={programId}>
            <Link
                href={href}
                className={programId === currentFilter ? 'font-semibold' : ''}
            >
                {`${name} (${transactionCount})`}
            </Link>
        </DropdownMenuItem>
    );
}
