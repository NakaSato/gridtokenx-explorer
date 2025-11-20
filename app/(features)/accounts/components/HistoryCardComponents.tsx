import { ConfirmedSignatureInfo, TransactionError } from '@solana/web3.js';
import React from 'react';
import { RefreshCw } from 'react-feather';
import { Button } from '@/app/(shared)/components/shared/ui/button';

export type TransactionRow = {
  slot: number;
  signature: string;
  err: TransactionError | null;
  blockTime: number | null | undefined;
  statusClass: string;
  statusText: string;
  signatureInfo: ConfirmedSignatureInfo;
};

export function HistoryCardHeader({
  title,
  refresh,
  fetching,
}: {
  title: string;
  refresh: () => void;
  fetching: boolean;
}) {
  return (
    <div className="flex items-center border-b px-6 py-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <Button variant="outline" size="sm" disabled={fetching} onClick={() => refresh()}>
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
  );
}

export function HistoryCardFooter({
  fetching,
  foundOldest,
  loadMore,
}: {
  fetching: boolean;
  foundOldest: boolean;
  loadMore: () => void;
}) {
  return (
    <div className="border-t px-6 py-4">
      {foundOldest ? (
        <div className="text-muted-foreground text-center">Fetched full history</div>
      ) : (
        <Button className="w-full" onClick={() => loadMore()} disabled={fetching}>
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
  );
}

export function getTransactionRows(transactions: ConfirmedSignatureInfo[]): TransactionRow[] {
  const transactionRows: TransactionRow[] = [];
  for (let i = 0; i < transactions.length; i++) {
    const slot = transactions[i].slot;
    const slotTransactions = [transactions[i]];
    while (i + 1 < transactions.length) {
      const nextSlot = transactions[i + 1].slot;
      if (nextSlot !== slot) break;
      slotTransactions.push(transactions[++i]);
    }

    for (const slotTransaction of slotTransactions) {
      let statusText;
      let statusClass;
      if (slotTransaction.err) {
        statusClass = 'bg-yellow-100 text-yellow-800';
        statusText = 'Failed';
      } else {
        statusClass = 'bg-green-100 text-green-800';
        statusText = 'Success';
      }
      transactionRows.push({
        blockTime: slotTransaction.blockTime,
        err: slotTransaction.err,
        signature: slotTransaction.signature,
        signatureInfo: slotTransaction,
        slot,
        statusClass,
        statusText,
      });
    }
  }

  return transactionRows;
}
