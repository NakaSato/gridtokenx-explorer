import { Address } from '@/app/(shared)/components/common/Address';
import { SolBalance } from '@/app/(shared)/components/common/SolBalance';
import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { Account } from '@/app/(core)/providers/accounts';
import { useCluster } from '@/app/(core)/providers/cluster';
import { addressLabel } from '@/app/(shared)/utils/tx';
import React from 'react';

export function UnknownAccountCard({ account }: { account: Account }) {
  const { cluster } = useCluster();

  const label = addressLabel(account.pubkey.toBase58(), cluster);
  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex items-center border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Overview</h3>
      </div>

      <TableCardBody>
        <tr>
          <td>Address</td>
          <td className="lg:text-right">
            <Address pubkey={account.pubkey} alignRight raw />
          </td>
        </tr>
        {label && (
          <tr>
            <td>Address Label</td>
            <td className="lg:text-right">{label}</td>
          </tr>
        )}
        <tr>
          <td>Balance (SOL)</td>
          <td className="lg:text-right">
            {account.lamports === 0 ? 'Account does not exist' : <SolBalance lamports={account.lamports} />}
          </td>
        </tr>

        {account.space !== undefined && (
          <tr>
            <td>Allocated Data Size</td>
            <td className="lg:text-right">{account.space} byte(s)</td>
          </tr>
        )}

        <tr>
          <td>Assigned Program Id</td>
          <td className="lg:text-right">
            <Address pubkey={account.owner} alignRight link />
          </td>
        </tr>

        <tr>
          <td>Executable</td>
          <td className="lg:text-right">{account.executable ? 'Yes' : 'No'}</td>
        </tr>
      </TableCardBody>
    </div>
  );
}
