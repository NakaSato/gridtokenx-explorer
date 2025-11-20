import { AccountAddressRow, AccountBalanceRow, AccountHeader } from '@/app/(shared)/components/common/Account';
import { Address } from '@/app/(shared)/components/common/Address';
import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { Account, useFetchAccountInfo } from '@/app/(core)/providers/accounts';
import { Card, CardContent } from '@/app/(shared)/components/shared/ui/card';
import { NonceAccount } from '@validators/accounts/nonce';
import React from 'react';

export function NonceAccountSection({ account, nonceAccount }: { account: Account; nonceAccount: NonceAccount }) {
  const refresh = useFetchAccountInfo();
  return (
    <Card>
      <AccountHeader title="Nonce Account" refresh={() => refresh(account.pubkey, 'parsed')} />

      <CardContent>
        <TableCardBody>
          <AccountAddressRow account={account} />
          <AccountBalanceRow account={account} />

          <tr>
            <td>Authority</td>
            <td className="lg:text-right">
              <Address pubkey={nonceAccount.info.authority} alignRight raw link />
            </td>
          </tr>

          <tr>
            <td>Blockhash</td>
            <td className="lg:text-right">
              <code>{nonceAccount.info.blockhash}</code>
            </td>
          </tr>

          <tr>
            <td>Fee</td>
            <td className="lg:text-right">
              {nonceAccount.info.feeCalculator.lamportsPerSignature} lamports per signature
            </td>
          </tr>
        </TableCardBody>
      </CardContent>
    </Card>
  );
}
