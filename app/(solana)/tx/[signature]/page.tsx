import { SignatureProps } from '@/app/(shared)/utils/index';
import { TransactionsProvider } from '@/app/(core)/providers/transactions';
import { AccountsProvider } from '@/app/(core)/providers/accounts';
import { Metadata } from 'next/types';
import React from 'react';

import TransactionDetailsPageClient from './page-client';

type Props = Readonly<{
  params: Promise<SignatureProps>;
}>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { signature } = await params;
  return {
    description: `Details of the Solana transaction with signature ${signature}`,
    title: `Transaction | ${signature} | Solana`,
  };
}

export default async function TransactionDetailsPage({ params }: Props) {
  const resolvedParams = await params;
  return (
    <TransactionsProvider>
      <AccountsProvider>
        <TransactionDetailsPageClient params={resolvedParams} />
      </AccountsProvider>
    </TransactionsProvider>
  );
}
