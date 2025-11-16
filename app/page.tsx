'use client';

import React, { Suspense } from 'react';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

import { Epoch } from '@components/common/EpochWrapper';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Slot } from '@components/common/SlotWrapper';
import { TableCardBody } from '@components/common/TableCardBody';
import { TimestampToggle } from '@components/common/TimestampToggle';
import { LiveTransactionStatsCard } from '@components/LiveTransactionStatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@components/shared/ui/card';
import { Skeleton } from '@components/shared/ui/skeleton';
import { StatsNotReady } from '@components/StatsNotReady';
import { useVoteAccounts } from '@providers/accounts/vote-accounts';
import { useCluster } from '@providers/cluster';
import { StatsProvider } from '@providers/stats';
import {
    ClusterStatsStatus,
    useDashboardInfo,
    usePerformanceInfo,
    useStatsProvider,
} from '@providers/stats/solanaClusterStats';
import { Status, SupplyProvider, useFetchSupply, useSupply } from '@providers/supply';
import { ClusterStatus } from '@utils/cluster';
import { abbreviatedNumber, lamportsToSol, slotsToHumanString } from '@utils/index';
import { percentage } from '@utils/math';

import { UpcomingFeatures } from './utils/feature-gate/UpcomingFeatures';

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
                    <div className="container mx-auto px-4 py-4">
                        <StakingComponent />

                        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="w-full">
                                <StatsCardBody />
                            </div>
                            <div className="w-full">
                                <LiveTransactionStatsCard />
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
            return voteAccounts.delinquent.reduce(
                (prev: bigint, current: any) => prev + current.activatedStake,
                BigInt(0),
            );
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
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-lg">Circulating Supply</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="text-xl font-bold break-words sm:text-2xl">
                        <span className="text-blue-600 dark:text-blue-400">{displayLamports(supply.circulating)}</span>
                        <span className="text-muted-foreground"> / {displayLamports(supply.total)}</span>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        <span className="text-blue-600 dark:text-blue-400">{circulatingPercentage}%</span> is
                        circulating
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm sm:text-lg">Active Stake</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {activeStake ? (
                        <div className="text-xl font-bold break-words sm:text-2xl">
                            <span className="text-blue-600 dark:text-blue-400">{displayLamports(activeStake)}</span>
                            <span className="text-muted-foreground"> / {displayLamports(supply.total)}</span>
                        </div>
                    ) : (
                        <Skeleton className="h-8 w-full" />
                    )}
                    {delinquentStakePercentage && (
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Delinquent stake:{' '}
                            <span className="text-blue-600 dark:text-blue-400">{delinquentStakePercentage}%</span>
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
    const epochProgress = percentage(slotIndex, slotsInEpoch, 2).toFixed(1) + '%';
    const epochTimeRemaining = slotsToHumanString(Number(slotsInEpoch - slotIndex), hourlySlotTime);
    const { blockHeight, absoluteSlot } = epochInfo;

    return (
        <Card className="h-full">
            <CardHeader className="border-b">
                <CardTitle className="text-base sm:text-lg">Live Cluster Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <TableCardBody>
                    <tr>
                        <td className="text-muted-foreground w-full px-3 py-2 text-sm sm:px-4 sm:text-base">Slot</td>
                        <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                            <Slot slot={absoluteSlot} link />
                        </td>
                    </tr>
                    {blockHeight !== undefined && (
                        <tr>
                            <td className="text-muted-foreground w-full px-3 py-2 text-sm sm:px-4 sm:text-base">
                                Block height
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                                <Slot slot={blockHeight} />
                            </td>
                        </tr>
                    )}
                    {blockTime && (
                        <tr>
                            <td className="text-muted-foreground w-full px-3 py-2 text-sm sm:px-4 sm:text-base">
                                Cluster time
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                                <TimestampToggle unixTimestamp={blockTime} shorter></TimestampToggle>
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td className="text-muted-foreground w-full px-3 py-2 text-sm sm:px-4 sm:text-base">
                            Slot time (1min average)
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                            {averageSlotTime}ms
                        </td>
                    </tr>
                    <tr>
                        <td className="text-muted-foreground w-full px-3 py-2 text-sm sm:px-4 sm:text-base">
                            Slot time (1hr average)
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                            {hourlySlotTime}ms
                        </td>
                    </tr>
                    <tr>
                        <td className="text-muted-foreground w-full px-3 py-2 text-sm sm:px-4 sm:text-base">Epoch</td>
                        <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                            <Epoch epoch={epochInfo.epoch} link />
                        </td>
                    </tr>
                    <tr>
                        <td className="text-muted-foreground w-full px-3 py-2 text-sm sm:px-4 sm:text-base">
                            Epoch progress
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                            {epochProgress}
                        </td>
                    </tr>
                    <tr>
                        <td className="text-muted-foreground w-full px-3 py-2 text-sm sm:px-4 sm:text-base">
                            Epoch time remaining (approx.)
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                            ~{epochTimeRemaining}
                        </td>
                    </tr>
                </TableCardBody>
            </CardContent>
        </Card>
    );
}
