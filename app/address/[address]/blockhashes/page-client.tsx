'use client';

import { BlockhashesCard } from '@/app/(shared)/components/account/BlockhashesCard';
import { ParsedAccountRenderer } from '@/app/(shared)/components/account/ParsedAccountRenderer';
import React from 'react';

type Props = Readonly<{
  params: {
    address: string;
  };
}>;

function BlockhashesCardRenderer({
  account,
  onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
  const parsedData = account?.data?.parsed;
  if (!parsedData || parsedData.program !== 'sysvar' || parsedData.parsed.type !== 'recentBlockhashes') {
    return onNotFound();
  }
  return <BlockhashesCard blockhashes={parsedData.parsed.info} />;
}

export default function RecentBlockhashesPageClient({ params: { address } }: Props) {
  return <ParsedAccountRenderer address={address} renderComponent={BlockhashesCardRenderer} />;
}
