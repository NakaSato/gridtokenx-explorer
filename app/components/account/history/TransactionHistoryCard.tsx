'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { useAccountHistory, useFetchAccountHistory } from '@providers/accounts/history';
import { FetchStatus } from '@providers/cache';
import { toAddress, addressToPublicKey } from '@utils/rpc';
import { PublicKey } from '@solana/web3.js';
import { displayTimestampUtc } from '@utils/date';
import React, { useMemo } from 'react';
import Moment from 'react-moment';
import { Card, CardContent } from '@components/shared/ui/card';
import { Badge } from '@components/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/shared/ui/table';
import { getTransactionRows, HistoryCardFooter, HistoryCardHeader } from '../HistoryCardComponents';

export function TransactionHistoryCard({ address }: { address: string }) {
    const pubkey = useMemo(() => addressToPublicKey(toAddress(address)), [address]);
    const history = useAccountHistory(address);
    const fetchAccountHistory = useFetchAccountHistory();
    const refresh = () => fetchAccountHistory(pubkey, false, true);
    const loadMore = () => fetchAccountHistory(pubkey, false);

    const transactionRows = React.useMemo(() => {
        if (history?.data?.fetched) {
            return getTransactionRows(history.data.fetched);
        }
        return [];
    }, [history]);

    React.useEffect(() => {
        if (!history) {
            refresh();
        }
    }, [address]); // eslint-disablline react-hooks/exhaustivdeps

    if (!history) {
        return null;
    }

    if (history?.data === undefined) {
        if (history.status === FetchStatus.Fetching) {
            return <LoadingCard message="Loading history" />;
        }

        return <ErrorCard retry={refresh} text="Failed to fetch transaction history" />;
    }

    const hasTimestamps = transactionRows.some(element => element.blockTime);
    const detailsList: React.ReactNode[] = transactionRows.map(
        ({ slot, signature, blockTime, statusClass, statusText }) => {
            return (
                <TableRow key={signature}>
                    <TableCell>
                        <Signature signature={signature} link truncateChars={60} />
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                        <Slot slot={slot} link />
                    </TableCell>

                    {hasTimestamps && (
                        <>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                {blockTime ? <Moment date={blockTime * 1000} fromNow /> : '---'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                {blockTime ? displayTimestampUtc(blockTime * 1000, true) : '---'}
                            </TableCell>
                        </>
                    )}

                    <TableCell className="whitespace-nowrap">
                        <Badge variant={statusClass === 'success' ? 'default' : 'secondary'}>
                            {statusText}
                        </Badge>
                    </TableCell>
                </TableRow>
            );
        },
    );

    const fetching = history.status === FetchStatus.Fetching;
    return (
        <Card>
            <HistoryCardHeader fetching={fetching} refresh={() => refresh()} title="Transaction History" />
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Transaction Signature</TableHead>
                            <TableHead>Block</TableHead>
                            {hasTimestamps && (
                                <>
                                    <TableHead>Age</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                </>
                            )}
                            <TableHead>Result</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>{detailsList}</TableBody>
                </Table>
            </CardContent>
            <HistoryCardFooter fetching={fetching} foundOldest={history.data.foundOldest} loadMore={() => loadMore()} />
        </Card>
    );
}
