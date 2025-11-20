'use client';

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ParsedAccountRenderer } from '@/app/(shared)/components/account/ParsedAccountRenderer';
import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { SecurityCard } from '@/app/features/security-txt/ui/SecurityCard';

type Props = Readonly<{
  params: {
    address: string;
  };
}>;

function SecurityCardRenderer({
  account,
  onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
  const parsedData = account?.data?.parsed;
  if (!parsedData || parsedData?.program !== 'bpf-upgradeable-loader') {
    return onNotFound();
  }
  return <SecurityCard data={parsedData} pubkey={account.pubkey} />;
}

export default function SecurityPageClient({ params: { address } }: Props) {
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => <ErrorCard text={`Failed to load security data: ${error.message}`} />}
    >
      <ParsedAccountRenderer address={address} renderComponent={SecurityCardRenderer} />
    </ErrorBoundary>
  );
}
