import { OwnedTokensCard } from '@/app/(features)/accounts/components/OwnedTokensCard';
import { TokenHistoryCard } from '@/app/(features)/accounts/components/TokenHistoryCard';
import getReadableTitleFromAddress, {
  AddressPageMetadataProps,
} from '@/app/(shared)/utils/get-readable-title-from-address';
import { Metadata } from 'next/types';
import React, { Suspense } from 'react';

import { TransactionsProvider } from '@/app/(core)/providers/transactions';

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  const { address } = await props.params;
  return {
    description: `All tokens owned by address ${address} on Solana`,
    title: `Tokens | ${await getReadableTitleFromAddress(props)} | Solana`,
  };
}

export default async function OwnedTokensPage({ params }: Props) {
  const { address } = await params;
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
