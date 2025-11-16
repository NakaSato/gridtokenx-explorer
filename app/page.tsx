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
            <div className="w-full">
                <div className="h-full rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900">
                    <div className="p-4 sm:p-6">
                        <h4 className="mb-2 text-sm font-semibold text-gray-900 sm:text-lg dark:text-white">
                            Circulating Supply
                        </h4>
                        <h1 className="mb-1 text-xl font-bold break-words text-gray-900 sm:text-2xl dark:text-white">
                            <em className="text-blue-600 dark:text-blue-400">{displayLamports(supply.circulating)}</em>{' '}
                            /{' '}
                            <small className="text-gray-600 dark:text-gray-400">{displayLamports(supply.total)}</small>
                        </h1>
                        <h5 className="text-sm font-medium text-gray-700 sm:text-base dark:text-gray-300">
                            <em className="text-blue-600 dark:text-blue-400">{circulatingPercentage}%</em> is
                            circulating
                        </h5>
                    </div>
                </div>
            </div>
            <div className="w-full">
                <div className="h-full rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900">
                    <div className="p-4 sm:p-6">
                        <h4 className="mb-2 text-sm font-semibold text-gray-900 sm:text-lg dark:text-white">
                            Active Stake
                        </h4>
                        {activeStake ? (
                            <h1 className="mb-1 text-xl font-bold break-words text-gray-900 sm:text-2xl dark:text-white">
                                <em className="text-blue-600 dark:text-blue-400">{displayLamports(activeStake)}</em> /{' '}
                                <small className="text-gray-600 dark:text-gray-400">
                                    {displayLamports(supply.total)}
                                </small>
                            </h1>
                        ) : (
                            <div className="mb-1 h-8 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
                        )}
                        {delinquentStakePercentage && (
                            <h5 className="text-sm font-medium text-gray-700 sm:text-base dark:text-gray-300">
                                Delinquent stake:{' '}
                                <em className="text-blue-600 dark:text-blue-400">{delinquentStakePercentage}%</em>
                            </h5>
                        )}
                    </div>
                </div>
            </div>
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
        <div className="h-full rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-gray-700">
                <h4 className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white">Live Cluster Stats</h4>
            </div>
            <TableCardBody>
                <tr>
                    <td className="w-full px-3 py-2 text-sm text-gray-700 sm:px-4 sm:text-base dark:text-gray-300">
                        Slot
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                        <Slot slot={absoluteSlot} link />
                    </td>
                </tr>
                {blockHeight !== undefined && (
                    <tr>
                        <td className="w-full px-3 py-2 text-sm text-gray-700 sm:px-4 sm:text-base dark:text-gray-300">
                            Block height
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                            <Slot slot={blockHeight} />
                        </td>
                    </tr>
                )}
                {blockTime && (
                    <tr>
                        <td className="w-full px-3 py-2 text-sm text-gray-700 sm:px-4 sm:text-base dark:text-gray-300">
                            Cluster time
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                            <TimestampToggle unixTimestamp={blockTime} shorter></TimestampToggle>
                        </td>
                    </tr>
                )}
                <tr>
                    <td className="w-full px-3 py-2 text-sm text-gray-700 sm:px-4 sm:text-base dark:text-gray-300">
                        Slot time (1min average)
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                        {averageSlotTime}ms
                    </td>
                </tr>
                <tr>
                    <td className="w-full px-3 py-2 text-sm text-gray-700 sm:px-4 sm:text-base dark:text-gray-300">
                        Slot time (1hr average)
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                        {hourlySlotTime}ms
                    </td>
                </tr>
                <tr>
                    <td className="w-full px-3 py-2 text-sm text-gray-700 sm:px-4 sm:text-base dark:text-gray-300">
                        Epoch
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                        <Epoch epoch={epochInfo.epoch} link />
                    </td>
                </tr>
                <tr>
                    <td className="w-full px-3 py-2 text-sm text-gray-700 sm:px-4 sm:text-base dark:text-gray-300">
                        Epoch progress
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                        {epochProgress}
                    </td>
                </tr>
                <tr>
                    <td className="w-full px-3 py-2 text-sm text-gray-700 sm:px-4 sm:text-base dark:text-gray-300">
                        Epoch time remaining (approx.)
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap sm:px-4 sm:text-base">
                        ~{epochTimeRemaining}
                    </td>
                </tr>
            </TableCardBody>
        </div>
    );
}
