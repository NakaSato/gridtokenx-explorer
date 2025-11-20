'use client';

import { ParsedAccountRenderer } from '@/app/(shared)/components/account/ParsedAccountRenderer';
import { SlotHashesCard } from '@/app/(shared)/components/account/SlotHashesCard';
import React from 'react';

type Props = Readonly<{
  params: {
    address: string;
  };
}>;

function SlotHashesCardRenderer({
  account,
  onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
  const parsedData = account?.data?.parsed;
  if (!parsedData || parsedData.program !== 'sysvar' || parsedData.parsed.type !== 'slotHashes') {
    return onNotFound();
  }
  return <SlotHashesCard sysvarAccount={parsedData.parsed} />;
}

export default function SlotHashesPageClient({ params: { address } }: Props) {
  return <ParsedAccountRenderer address={address} renderComponent={SlotHashesCardRenderer} />;
}
