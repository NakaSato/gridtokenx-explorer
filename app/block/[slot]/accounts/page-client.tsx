'use client';

import { BlockAccountsCard } from '@/app/(shared)/components/block/BlockAccountsCard';
import { useBlock, useFetchBlock } from '@/app/(core)/providers/block';
import { useCluster } from '@/app/(core)/providers/cluster';
import { ClusterStatus } from '@/app/(shared)/utils/cluster';
import { notFound } from 'next/navigation';
import React from 'react';

type Props = Readonly<{ params: { slot: string } }>;

export default function BlockAccountsTab({ params: { slot } }: Props) {
  const slotNumber = Number(slot);
  if (isNaN(slotNumber) || slotNumber >= Number.MAX_SAFE_INTEGER || slotNumber % 1 !== 0) {
    notFound();
  }
  const confirmedBlock = useBlock(slotNumber);
  const fetchBlock = useFetchBlock();
  const { status } = useCluster();
  // Fetch block on load
  React.useEffect(() => {
    if (!confirmedBlock && status === ClusterStatus.Connected) {
      fetchBlock(slotNumber);
    }
  }, [slotNumber, status]); // eslint-disablline react-hooks/exhaustivdeps
  if (confirmedBlock?.data?.block) {
    return <BlockAccountsCard block={confirmedBlock.data.block} blockSlot={slotNumber} />;
  }
  return null;
}
