import { Address as AddressComponent } from '@/app/(shared)/components/Address';
import { Signature } from '@/app/(shared)/components/Signature';
import { SolBalance } from '@/app/(shared)/components/SolBalance';
import { StatusBadge } from '@/app/(shared)/components/StatusBadge';
import { TableCell, TableRow } from '@/app/(shared)/components/ui/table';
import { toAddress, addressToPublicKey } from '@/app/(shared)/utils/rpc';
import React from 'react';
import { TransactionWithInvocations } from '../hooks/useBlockHistory';

type BlockHistoryRowProps = {
  tx: TransactionWithInvocations;
  showComputeUnits: boolean;
};

export function BlockHistoryRow({ tx, showComputeUnits }: BlockHistoryRowProps) {
  const entries = [...tx.invocations.entries()];
  entries.sort((a, b) => b[1] - a[1]);

  return (
    <TableRow>
      <TableCell>{tx.index + 1}</TableCell>

      <TableCell>
        <Signature signature={tx.signature || ''} link truncate />
      </TableCell>

      <TableCell>
        <AddressComponent pubkey={tx.payer} link truncate />
      </TableCell>

      <TableCell>
        <StatusBadge status={tx.meta?.err ? 'error' : 'success'} />
      </TableCell>

      <TableCell>
        <SolBalance lamports={tx.meta?.fee || 0} />
      </TableCell>

      {showComputeUnits && (
        <TableCell>
          {tx.computeUnits ? tx.computeUnits.toLocaleString('en-US') : 'N/A'}
        </TableCell>
      )}

      <TableCell>
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
      </TableCell>
    </TableRow>
  );
}
