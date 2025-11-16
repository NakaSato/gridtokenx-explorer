'use client';

import React, { Suspense } from 'react';
import { BlockHistoryCard } from '@components/block/BlockHistoryCard';
import { useBlock, useFetchBlock } from '@providers/block';
import { useCluster } from '@providers/cluster';
import { ClusterStatus } from '@utils/cluster';
import { getEpochForSlot } from '@utils/epoch-schedule';
import { notFound } from 'next/navigation';

type Props = Readonly<{ params: { slot: string } }>;

export default function BlockTransactionsTabClient({ params: { slot } }: Props) {
  const slotNumber = Number(slot);
  if (isNaN(slotNumber) || slotNumber >= Number.MAX_SAFE_INTEGER || slotNumber % 1 !== 0) {
    notFound();
  }
  const confirmedBlock = useBlock(slotNumber);
  const fetchBlock = useFetchBlock();
  const { status, clusterInfo } = useCluster();

  // Calculate epoch from slot
  const epoch = React.useMemo(() => {
    if (clusterInfo) {
      return getEpochForSlot(clusterInfo.epochSchedule, BigInt(slotNumber));
    }
    return undefined;
  }, [clusterInfo, slotNumber]);

  // Fetch block on load
  React.useEffect(() => {
    if (!confirmedBlock && status === ClusterStatus.Connected) {
      fetchBlock(slotNumber);
    }
  }, [slotNumber, status]); // eslint-disablline react-hooks/exhaustivdeps
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
      {confirmedBlock?.data?.block ? <BlockHistoryCard block={confirmedBlock.data.block} epoch={epoch} /> : null}
    </Suspense>
  );
}
