'use client';

import React, { Suspense } from 'react';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

import { Epoch } from '@/app/(shared)/components';
import { ErrorCard, LoadingCard } from '@/app/(shared)/components';
import { Slot } from '@/app/(shared)/components';
import { TimestampToggle } from '@/app/(shared)/components';

import { Badge } from '@/app/(shared)/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Progress } from '@/app/(shared)/components/ui/progress';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import StatsNotReady from '@/app/(features)/analytics/components/StatsNotReady';
import { useVoteAccounts } from '@/app/(core)/providers/accounts/vote-accounts';
import { useCluster } from '@/app/(core)/providers/cluster';
import { StatsProvider } from '@/app/(core)/providers/stats';
import {
  ClusterStatsStatus,
  useDashboardInfo,
  usePerformanceInfo,
  useStatsProvider,
} from '@/app/(core)/providers/stats/solanaClusterStats';
import { Status, SupplyProvider, useFetchSupply, useSupply } from '@/app/(core)/providers/supply';
import { ClusterStatus } from '@/app/(shared)/utils/cluster';
import { abbreviatedNumber, lamportsToSol, slotsToHumanString } from '@/app/(shared)/utils';
import { percentage } from '@/app/(shared)/utils/math';

import { UpcomingFeatures } from '@/app/(shared)/utils/feature-gate/UpcomingFeatures';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto mt-4 px-4">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      }
    >
      <StatsProvider>
        <SupplyProvider>
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <StakingComponent />

            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="w-full">
                <StatsCardBody />
              </div>
            </div>

            <UpcomingFeatures />
          </div>
        </SupplyProvider>
      </StatsProvider>
    </Suspense>
  );
}

function StakingComponent() {
  const { status } = useCluster();
  const supply = useSupply();
  const fetchSupply = useFetchSupply();
  const { fetchVoteAccounts, voteAccounts } = useVoteAccounts();

  function fetchData() {
    fetchSupply();
    fetchVoteAccounts();
  }

  React.useEffect(() => {
    if (status === ClusterStatus.Connected) {
      fetchData();
    }
  }, [status]); // eslint-disablline react-hooks/exhaustivdeps

  const delinquentStake = React.useMemo(() => {
    if (voteAccounts) {
      return voteAccounts.delinquent.reduce((prev: bigint, current: any) => prev + current.activatedStake, BigInt(0));
    }
  }, [voteAccounts]);

  const activeStake = React.useMemo(() => {
    if (voteAccounts && delinquentStake) {
      return (
        voteAccounts.current.reduce((prev: bigint, current: any) => prev + current.activatedStake, BigInt(0)) +
        delinquentStake
      );
    }
  }, [voteAccounts, delinquentStake]);

  if (supply === Status.Disconnected) {
    // we'll return here to prevent flicker
    return null;
  }

  if (supply === Status.Idle || supply === Status.Connecting) {
    return <LoadingCard message="Loading supply data" />;
  } else if (typeof supply === 'string') {
    return <ErrorCard text={supply} retry={fetchData} />;
  }

  // Don't display the staking card if the supply is 0
  if (supply.circulating === BigInt(0) && supply.total === BigInt(0)) {
    return null;
  }

  // Calculate to 2dp for accuracy, then display as 1
  const circulatingPercentage = percentage(supply.circulating, supply.total, 2).toFixed(1);

  let delinquentStakePercentage;
  if (delinquentStake && activeStake) {
    delinquentStakePercentage = percentage(delinquentStake, activeStake, 2).toFixed(1);
  }

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg">Circulating Supply</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 sm:space-y-2">
          <div className="text-lg font-bold break-words sm:text-xl md:text-2xl">
            <span className="text-blue-600 dark:text-blue-400">{displayLamports(supply.circulating)}</span>
            <span className="text-muted-foreground"> / {displayLamports(supply.total)}</span>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            <span className="text-blue-600 dark:text-blue-400">{circulatingPercentage}%</span> is circulating
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg">Active Stake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 sm:space-y-2">
          {activeStake ? (
            <div className="text-lg font-bold break-words sm:text-xl md:text-2xl">
              <span className="text-blue-600 dark:text-blue-400">{displayLamports(activeStake)}</span>
              <span className="text-muted-foreground"> / {displayLamports(supply.total)}</span>
            </div>
          ) : (
            <Skeleton className="h-8 w-full" />
          )}
          {delinquentStakePercentage && (
            <p className="text-muted-foreground text-sm sm:text-base">
              Delinquent stake: <span className="text-blue-600 dark:text-blue-400">{delinquentStakePercentage}%</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function displayLamports(value: number | bigint) {
  return abbreviatedNumber(lamportsToSol(value));
}

function StatsCardBody() {
  const dashboardInfo = useDashboardInfo();
  const performanceInfo = usePerformanceInfo();
  const { setActive } = useStatsProvider();
  const { cluster } = useCluster();

  React.useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, [setActive, cluster]);

  if (performanceInfo.status !== ClusterStatsStatus.Ready || dashboardInfo.status !== ClusterStatsStatus.Ready) {
    const error =
      performanceInfo.status === ClusterStatsStatus.Error || dashboardInfo.status === ClusterStatsStatus.Error;
    return <StatsNotReady error={error} />;
  }

  const { avgSlotTime_1h, avgSlotTime_1min, epochInfo, blockTime } = dashboardInfo;
  const hourlySlotTime = Math.round(1000 * avgSlotTime_1h);
  const averageSlotTime = Math.round(1000 * avgSlotTime_1min);
  const { slotIndex, slotsInEpoch } = epochInfo;
  const epochProgressValue = parseFloat(percentage(slotIndex, slotsInEpoch, 2).toFixed(1));
  const epochTimeRemaining = slotsToHumanString(Number(slotsInEpoch - slotIndex), hourlySlotTime);
  const { blockHeight, absoluteSlot } = epochInfo;

  // Determine slot time health
  const getSlotTimeHealth = (time: number) => {
    if (time < 450) return { status: 'good', color: 'text-green-600 dark:text-green-400', badge: 'Fast' };
    if (time < 550) return { status: 'good', color: 'text-blue-600 dark:text-blue-400', badge: 'Normal' };
    if (time < 700) return { status: 'warning', color: 'text-yellow-600 dark:text-yellow-400', badge: 'Slow' };
    return { status: 'error', color: 'text-red-600 dark:text-red-400', badge: 'Very Slow' };
  };

  const slotTimeHealth = getSlotTimeHealth(averageSlotTime);

  return (
    <Card className="h-full">
      <CardHeader className="border-b pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
          {/* <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div> */}
          Live Cluster Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-3 sm:space-y-6 sm:p-4">
        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="space-y-3">
            <div className="bg-muted/50 flex items-center justify-between rounded-lg p-2.5 sm:p-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase sm:text-xs">Current Slot</p>
                <p className="text-primary font-mono text-base font-bold sm:text-lg">
                  <Slot slot={absoluteSlot} link />
                </p>
              </div>
            </div>

            {blockHeight !== undefined && (
              <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
                <div>
                  <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase sm:text-xs">Block Height</p>
                  <p className="text-primary font-mono text-base font-bold sm:text-lg">
                    <Slot slot={blockHeight} />
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
              <div>
                <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase sm:text-xs">Epoch</p>
                <p className="text-primary font-mono text-base font-bold sm:text-lg">
                  <Epoch epoch={epochInfo.epoch} link />
                </p>
              </div>
            </div>

            {blockTime && (
              <div className="bg-muted/50 flex items-center justify-between rounded-lg p-3">
                <div>
                  <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase sm:text-xs">Cluster Time</p>
                  <div className="text-primary font-mono text-xs sm:text-sm">
                    <TimestampToggle unixTimestamp={blockTime} shorter></TimestampToggle>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Epoch Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium sm:text-sm">Epoch Progress</p>
            <Badge variant="secondary" className="text-[10px] sm:text-xs">
              {epochProgressValue.toFixed(1)}%
            </Badge>
          </div>
          <Progress value={epochProgressValue} className="h-2" />
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>Slot {slotIndex.toLocaleString()}</span>
            <span>~{epochTimeRemaining} remaining</span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-4">
          <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase sm:text-sm">Performance</h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs sm:text-sm">Slot Time (1min avg)</p>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className={`font-mono text-sm font-bold sm:text-base ${slotTimeHealth.color}`}>{averageSlotTime}ms</span>
                  <Badge variant="outline" className={`text-[10px] sm:text-xs ${slotTimeHealth.color.replace('text-', 'border-')}`}>
                    {slotTimeHealth.badge}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-xs sm:text-sm">Slot Time (1hr avg)</p>
                <span className="text-primary font-mono text-sm font-bold sm:text-base">{hourlySlotTime}ms</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
