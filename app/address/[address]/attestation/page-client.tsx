'use client';

import { ParsedAccountRenderer } from '@/app/(shared)/components/account/ParsedAccountRenderer';
import React, { Suspense } from 'react';

import { AttestationDataCard } from '@/app/(shared)/components/account/sas/AttestationDataCard';
import { LoadingCard } from '@/app/(shared)/components/common/LoadingCard';

type Props = Readonly<{
  params: {
    address: string;
  };
}>;

function AttestationCardRenderer({
  account,
  onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
  return (
    <Suspense fallback={<LoadingCard />}>{<AttestationDataCard account={account} onNotFound={onNotFound} />}</Suspense>
  );
}

export default function AttestationPageClient({ params: { address } }: Props) {
  return <ParsedAccountRenderer address={address} renderComponent={AttestationCardRenderer} />;
}
