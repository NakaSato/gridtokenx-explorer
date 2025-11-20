import { Address as AddressComponent } from '@/app/(shared)/components/common/Address';
import { toAddress, addressToPublicKey } from '@/app/(shared)/utils/rpc';
import { VersionedBlockResponse } from '@solana/web3.js';
import { useClusterPath } from '@/app/(shared)/utils/url';
import Link from 'next/link';
import React from 'react';

type AccountStats = {
  reads: number;
  writes: number;
};

const PAGE_SIZE = 25;

export function BlockAccountsCard({ block, blockSlot }: { block: VersionedBlockResponse; blockSlot: number }) {
  const [numDisplayed, setNumDisplayed] = React.useState(10);
  const totalTransactions = block.transactions.length;

  const accountStats = React.useMemo(() => {
    const statsMap = new Map<string, AccountStats>();
    block.transactions.forEach(tx => {
      const message = tx.transaction.message;
      const txSet = new Map<string, boolean>();
      const accountKeys = message.getAccountKeys({
        accountKeysFromLookups: tx.meta?.loadedAddresses,
      });
      message.compiledInstructions.forEach(ix => {
        ix.accountKeyIndexes.forEach(index => {
          const address = accountKeys.get(index)!.toBase58();
          txSet.set(address, message.isAccountWritable(index));
        });
      });

      txSet.forEach((isWritable, address) => {
        const stats = statsMap.get(address) || { reads: 0, writes: 0 };
        if (isWritable) {
          stats.writes++;
        } else {
          stats.reads++;
        }
        statsMap.set(address, stats);
      });
    });

    const accountEntries: [string, AccountStats][] = [];
    statsMap.forEach((value, key) => {
      accountEntries.push([key, value]);
    });

    accountEntries.sort((a, b) => {
      const aCount = a[1].reads + a[1].writes;
      const bCount = b[1].reads + b[1].writes;
      if (aCount < bCount) return 1;
      if (aCount > bCount) return -1;
      return 0;
    });

    return accountEntries;
  }, [block]);

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex items-center border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Block Account Usage</h3>
      </div>

      <div className="mb-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-muted-foreground">Account</th>
              <th className="text-muted-foreground">Read-Write Count</th>
              <th className="text-muted-foreground">Read-Only Count</th>
              <th className="text-muted-foreground">Total Count</th>
              <th className="text-muted-foreground">% of Transactions</th>
            </tr>
          </thead>
          <tbody>
            {accountStats.slice(0, numDisplayed).map(([address, { writes, reads }]) => (
              <StatsRow
                address={address}
                blockSlot={blockSlot}
                key={address}
                reads={reads}
                totalTransactions={totalTransactions}
                writes={writes}
              />
            ))}
          </tbody>
        </table>
      </div>

      {accountStats.length > numDisplayed && (
        <div className="border-t px-6 py-4">
          <button
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2"
            onClick={() => setNumDisplayed(displayed => displayed + PAGE_SIZE)}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

function StatsRow({
  address,
  blockSlot,
  writes,
  reads,
  totalTransactions,
}: {
  address: string;
  blockSlot: number;
  writes: number;
  reads: number;
  totalTransactions: number;
}) {
  const accountPath = useClusterPath({
    additionalParams: new URLSearchParams(`accountFilter=${address}&filter=all`),
    pathname: `/block/${blockSlot}`,
  });
  return (
    <tr>
      <td>
        <Link href={accountPath}>
          <AddressComponent pubkey={addressToPublicKey(toAddress(address))} />
        </Link>
      </td>
      <td>{writes}</td>
      <td>{reads}</td>
      <td>{writes + reads}</td>
      <td>{((100 * (writes + reads)) / totalTransactions).toFixed(2)}%</td>
    </tr>
  );
}
