import { TransactionHistoryCard } from '@components/account/history/TransactionHistoryCard';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';
import React, { Suspense } from 'react';

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
  searchParams: Promise<{
    cluster: string;
    customUrl?: string;
  }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  const { address } = await props.params;
  return {
    description: `History of all transactions involving the address ${address} on Solana`,
    title: `Transaction History | ${await getReadableTitleFromAddress(props)} | Solana`,
  };
}

export default function TransactionHistoryPage({ params, searchParams }: Props) {
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
      <div className="container mt-4">
        <TransactionHistoryCard address={address} />
      </div>
    </Suspense>
  );
}
