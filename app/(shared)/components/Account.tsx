import { SolBalance } from '@/app/(shared)/components/SolBalance';
import { Account } from '@/app/(core)/providers/accounts';
import { Button } from '@/app/(shared)/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import React from 'react';
import { RefreshCw } from 'react-feather';

import { Address } from './Address';

type AccountHeaderProps = {
  title: string;
  refresh: () => void;
};

type AccountProps = {
  account: Account;
};

export function AccountHeader({ title, refresh }: AccountHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => refresh()}>
          <RefreshCw className="mr-2 h-3 w-3" />
          Refresh
        </Button>
      </div>
    </CardHeader>
  );
}

export function AccountAddressRow({ account }: AccountProps) {
  return (
    <tr>
      <td>Address</td>
      <td className="lg:text-right">
        <Address pubkey={account.pubkey} alignRight raw />
      </td>
    </tr>
  );
}

export function AccountBalanceRow({ account }: AccountProps) {
  const { lamports } = account;
  return (
    <tr>
      <td>Balance (SOL)</td>
      <td className="uppercase lg:text-right">
        <SolBalance lamports={lamports} />
      </td>
    </tr>
  );
}
