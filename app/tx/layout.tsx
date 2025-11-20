import { TransactionsProvider } from '@/app/(core)/providers/transactions';
import { PropsWithChildren } from 'react';

import { AccountsProvider } from '@/app/(core)/providers/accounts';

export default function TxLayout({ children }: PropsWithChildren<Record<string, never>>) {
  return (
    <TransactionsProvider>
      <AccountsProvider>{children}</AccountsProvider>
    </TransactionsProvider>
  );
}
