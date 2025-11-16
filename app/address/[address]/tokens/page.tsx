import { OwnedTokensCard } from '@components/account/OwnedTokensCard';
import { TokenHistoryCard } from '@components/account/TokenHistoryCard';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';
import React, { Suspense } from 'react';

import { TransactionsProvider } from '@/app/providers/transactions';

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  return {
    description: `All tokens owned by the address ${props.params.address} on Solana`,
    title: `Tokens | ${await getReadableTitleFromAddress(props)} | Solana`,
  };
}

export default function OwnedTokensPage({ params }: Props) {
  const { address } = React.use(params);
  return (
    <Suspense
      fallback={
        <div className="container mt-4">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      }
    >
      <TransactionsProvider>
        <OwnedTokensCard address={address} />
        <TokenHistoryCard address={address} />
      </TransactionsProvider>
    </Suspense>
  );
}
