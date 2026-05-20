'use client';

import React, { Suspense } from 'react';
import { Epoch } from '@/app/(shared)/components/common/Epoch';
import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { LoadingCard } from '@/app/(shared)/components/common/LoadingCard';
import { Slot } from '@/app/(shared)/components/common/Slot';
import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { FetchStatus } from '@/app/(core)/providers/cache';
import { useCluster } from '@/app/(core)/providers/cluster';
import { useEpoch, useFetchEpoch } from '@/app/(core)/providers/epoch';
import { ClusterStatus } from '@/app/(shared)/utils/cluster';
import { displayTimestampUtc } from '@/app/(shared)/utils/date';

import { getFirstSlotInEpoch, getLastSlotInEpoch } from '@/app/(shared)/utils/epoch-schedule';

type Props = {
  params: {
    epoch: string;
  };
};

export default function EpochDetailsPageClient({ params: { epoch } }: Props) {
  let output;
  if (isNaN(Number(epoch))) {
    output = <ErrorCard text={`Epoch ${epoch} is not valid`} />;
  } else {
    output = <EpochOverviewCard epoch={Number(epoch)} />;
  }

  return (
    <Suspense
      fallback={
        <div className="container mx-auto -mt-12 px-4">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      }
    >
      <div className="container mx-auto -mt-12 px-4">
        <div className="header">
          <div className="header-body">
            <h6 className="header-pretitle">Details</h6>
            <h2 className="header-title">Epoch</h2>
          </div>
        </div>
        {output}
      </div>
    </Suspense>
  );
}

type OverviewProps = { epoch: number };

function EpochOverviewCard({ epoch }: OverviewProps) {
  const { status, clusterInfo } = useCluster();

  const epochState = useEpoch(epoch);
  const fetchEpoch = useFetchEpoch();

  // Fetch extra epoch info on load
  React.useEffect(() => {
    if (!clusterInfo) return;
    const { epochInfo, epochSchedule } = clusterInfo;
    const currentEpoch = epochInfo.epoch;
    if (epoch <= currentEpoch && !epochState && status === ClusterStatus.Connected)
      fetchEpoch(epoch, currentEpoch, epochSchedule);
  }, [epoch, epochState, clusterInfo, status, fetchEpoch]);

  if (!clusterInfo) {
    return <LoadingCard message="Connecting to cluster" />;
  }

  const { epochInfo, epochSchedule } = clusterInfo;
  const currentEpoch = epochInfo.epoch;
  if (epoch > currentEpoch) {
    return <ErrorCard text={`Epoch ${epoch} hasn't started yet`} />;
  } else if (!epochState?.data) {
    if (epochState?.status === FetchStatus.FetchFailed) {
      return <ErrorCard text={`Failed to fetch details for epoch ${epoch}`} />;
    }
    return <LoadingCard message="Loading epoch" />;
  }

  const firstSlot = getFirstSlotInEpoch(epochSchedule, BigInt(epoch));
  const lastSlot = getLastSlotInEpoch(epochSchedule, BigInt(epoch));

  return (
    <>
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="border-b px-6 py-4">
          <h3 className="mb-0 flex items-center text-lg font-semibold">Overview</h3>
        </div>
        <TableCardBody>
          <tr>
            <td className="w-full">Epoch</td>
            <td className="font-mono lg:text-right">
              <Epoch epoch={epoch} />
            </td>
          </tr>
          {epoch > 0 && (
            <tr>
              <td className="w-full">Previous Epoch</td>
              <td className="font-mono lg:text-right">
                <Epoch epoch={epoch - 1} link />
              </td>
            </tr>
          )}
          <tr>
            <td className="w-full">Next Epoch</td>
            <td className="font-mono lg:text-right">
              {currentEpoch > epoch ? (
                <Epoch epoch={epoch + 1} link />
              ) : (
                <span className="text-muted-foreground">Epoch in progress</span>
              )}
            </td>
          </tr>
          <tr>
            <td className="w-full">First Slot</td>
            <td className="font-mono lg:text-right">
              <Slot slot={firstSlot} />
            </td>
          </tr>
          <tr>
            <td className="w-full">Last Slot</td>
            <td className="font-mono lg:text-right">
              <Slot slot={lastSlot} />
            </td>
          </tr>
          {epochState.data.firstTimestamp && (
            <tr>
              <td className="w-full">First Block Timestamp</td>
              <td className="lg:text-right">
                <span className="font-mono">{displayTimestampUtc(epochState.data.firstTimestamp * 1000, true)}</span>
              </td>
            </tr>
          )}
          <tr>
            <td className="w-full">First Block</td>
            <td className="font-mono lg:text-right">
              <Slot slot={epochState.data.firstBlock} link />
            </td>
          </tr>
          <tr>
            <td className="w-full">Last Block</td>
            <td className="font-mono lg:text-right">
              {epochState.data.lastBlock !== undefined ? (
                <Slot slot={epochState.data.lastBlock} link />
              ) : (
                <span className="text-muted-foreground">Epoch in progress</span>
              )}
            </td>
          </tr>
          {epochState.data.lastTimestamp && (
            <tr>
              <td className="w-full">Last Block Timestamp</td>
              <td className="lg:text-right">
                <span className="font-mono">{displayTimestampUtc(epochState.data.lastTimestamp * 1000, true)}</span>
              </td>
            </tr>
          )}
        </TableCardBody>
      </div>
    </>
  );
}
