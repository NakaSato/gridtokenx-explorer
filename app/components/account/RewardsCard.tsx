'use client';

import { Epoch } from '@components/common/Epoch';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Slot } from '@components/common/Slot';
import { useAccountInfo } from '@providers/accounts';
import { useFetchRewards, useRewards } from '@providers/accounts/rewards';
import { FetchStatus } from '@providers/cache';
import { toAddress, addressToPublicKey } from '@utils/rpc';
import { PublicKey } from '@solana/web3.js';
import { lamportsToSolString } from '@utils/index';
import React from 'react';

const U64_MAX = BigInt('0xffffffffffffffff');

export function RewardsCard({ address }: { address: string }) {
    const pubkey = React.useMemo(() => addressToPublicKey(toAddress(address)), [address]);
    const info = useAccountInfo(address);
    const account = info?.data;
    const parsedData = account?.data.parsed;

    const highestEpoch = React.useMemo(() => {
        if (!parsedData) return;
        if (parsedData.program !== 'stake') return;
        const stakeInfo = parsedData.parsed.info.stake;
        if (stakeInfo !== null && stakeInfo.delegation.deactivationEpoch !== U64_MAX) {
            return Number(stakeInfo.delegation.deactivationEpoch);
        }
    }, [parsedData]);

    const rewards = useRewards(address);
    const fetchRewards = useFetchRewards();
    const loadMore = () => fetchRewards(pubkey, highestEpoch);

    React.useEffect(() => {
        if (!rewards) {
            fetchRewards(pubkey, highestEpoch);
        }
    }, []); // eslint-disablline react-hooks/exhaustivdeps

    if (!rewards) {
        return null;
    }

    if (rewards?.data === undefined) {
        if (rewards.status === FetchStatus.Fetching) {
            return <LoadingCard message="Loading rewards" />;
        }

        return <ErrorCard retry={loadMore} text="Failed to fetch rewards" />;
    }

    const rewardsList = rewards.data.rewards.map(reward => {
        if (!reward) {
            return null;
        }

        return (
            <tr key={reward.epoch}>
                <td>
                    <Epoch epoch={reward.epoch} link />
                </td>
                <td>
                    <Slot slot={reward.effectiveSlot} link />
                </td>
                <td>{lamportsToSolString(reward.amount)}</td>
                <td>{lamportsToSolString(reward.postBalance)}</td>
            </tr>
        );
    });
    const rewardsFound = rewardsList.some(r => r);
    const { foundOldest, lowestFetchedEpoch, highestFetchedEpoch } = rewards.data;
    const fetching = rewards.status === FetchStatus.Fetching;

    return (
        <>
            <div className="bg-card rounded-lg border shadow-sm">
                <div className="border-b px-6 py-4">
                    <div className="flex items-center">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold">Rewards</h3>
                        </div>
                    </div>
                </div>

                {rewardsFound ? (
                    <div className="mb-0 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="text-muted-foreground w-1">Epoch</th>
                                    <th className="text-muted-foreground">Effective Slot</th>
                                    <th className="text-muted-foreground">Reward Amount</th>
                                    <th className="text-muted-foreground">Post Balance</th>
                                </tr>
                            </thead>
                            <tbody className="list">{rewardsList}</tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-6">
                        No rewards issued between epochs {lowestFetchedEpoch} and {highestFetchedEpoch}
                    </div>
                )}

                <div className="border-t px-6 py-4">
                    {foundOldest ? (
                        <div className="text-muted-foreground text-center">Fetched full reward history</div>
                    ) : (
                        <button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2"
                            onClick={() => loadMore()}
                            disabled={fetching}
                        >
                            {fetching ? (
                                <>
                                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-text-top"></span>
                                    Loading
                                </>
                            ) : (
                                'Load More'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
