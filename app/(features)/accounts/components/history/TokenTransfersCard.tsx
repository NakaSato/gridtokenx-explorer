'use client';

import { Address } from '@/app/(shared)/components/common/Address';
import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { LoadingCard } from '@/app/(shared)/components/common/LoadingCard';
import { useAccountHistory } from '@/app/(core)/providers/accounts';
import { useFetchAccountHistory } from '@/app/(core)/providers/accounts/history';
import { FetchStatus } from '@/app/(core)/providers/cache';
import { useCluster } from '@/app/(core)/providers/cluster';
import { toAddress, addressToPublicKey } from '@/app/(shared)/utils/rpc';
import { ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { Cluster } from '@/app/(shared)/utils/cluster';
import React, { useMemo } from 'react';
import Moment from 'react-moment';

import { getTransactionRows, HistoryCardFooter, HistoryCardHeader } from '../HistoryCardComponents';

type TransferData = {
  amountString: string;
  blockTime: number | undefined;
  index: number;
  signature: string;
  statusClass: string;
  statusText: string;
  units: string;
};

function TransferRow({ data, hasTimestamps }: { data: TransferData; hasTimestamps: boolean }) {
  const { signature, blockTime, statusText, statusClass, amountString, units } = data;

  return (
    <tr key={signature + data.index}>
      <td>
        <span className="font-mono text-xs">{signature.slice(0, 8)}...</span>
      </td>

      {hasTimestamps && (
        <td className="text-muted-foreground">{blockTime && <Moment date={blockTime * 1000} fromNow />}</td>
      )}

      <td>
        <Address pubkey={new PublicKey('11111111111111111111111111111111') as any} link truncateChars={16} />
      </td>

      <td>
        <Address pubkey={new PublicKey('11111111111111111111111111111111') as any} link truncateChars={16} />
      </td>

      <td>
        {amountString} {units}
      </td>

      <td>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            statusClass === 'success' ? 'bg-green-100 text-green-800' : 'bg-gray-800 text-white'
          }`}
        >
          {statusText}
        </span>
      </td>
    </tr>
  );
}

export function TokenTransfersCard({ address }: { address: string }) {
  const { cluster } = useCluster();
  const pubkey = useMemo(() => addressToPublicKey(toAddress(address)) as any, [address]);
  const history = useAccountHistory(address);
  const fetchAccountHistory = useFetchAccountHistory();
  const refresh = () => fetchAccountHistory(pubkey, true, true);
  const loadMore = () => fetchAccountHistory(pubkey, true);

  const transactionRows = React.useMemo(() => {
    if (history?.data?.fetched) {
      return getTransactionRows(history.data.fetched);
    }
    return [];
  }, [history]);

  React.useEffect(() => {
    if (!history || !history.data?.transactionMap?.size) {
      refresh();
    }
  }, [address]); // eslint-disablline react-hooks/exhaustivdeps

  const { allTransfers, hasTimestamps } = React.useMemo(() => {
    const hasTimestamps = transactionRows.some(element => element.blockTime);
    const allTransfers: TransferData[] = [];

    transactionRows.forEach(({ signature, blockTime, statusText, statusClass }) => {
      // Create a mock transfer for each transaction
      allTransfers.push({
        amountString: '0.00',
        blockTime: blockTime || undefined,
        index: allTransfers.length,
        signature,
        statusClass,
        statusText,
        units: 'Tokens',
      });
    });

    return {
      allTransfers,
      hasTimestamps,
    };
  }, [history, transactionRows]);

  if (!history) {
    return null;
  }

  if (history?.data === undefined) {
    if (history.status === FetchStatus.Fetching) {
      return <LoadingCard message="Loading token transfers" />;
    }

    return <ErrorCard retry={refresh} text="Failed to fetch token transfers" />;
  }

  const fetching = history.status === FetchStatus.Fetching;
  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <HistoryCardHeader fetching={fetching} refresh={() => refresh()} title="Token Transfers" />
      <div className="mb-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-muted-foreground">Transaction Signature</th>
              {hasTimestamps && <th className="text-muted-foreground">Age</th>}
              <th className="text-muted-foreground">Source</th>
              <th className="text-muted-foreground">Destination</th>
              <th className="text-muted-foreground">Amount</th>
              <th className="text-muted-foreground">Result</th>
            </tr>
          </thead>
          <tbody className="list">
            {allTransfers.map(transferData => (
              <TransferRow
                key={transferData.signature + transferData.index}
                data={transferData}
                hasTimestamps={hasTimestamps}
              />
            ))}
          </tbody>
        </table>
      </div>
      <HistoryCardFooter fetching={fetching} foundOldest={history.data.foundOldest} loadMore={() => loadMore()} />
    </div>
  );
}
