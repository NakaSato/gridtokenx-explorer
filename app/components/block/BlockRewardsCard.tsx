import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { PublicKey, VersionedBlockResponse } from '@solana/web3.js';
import React from 'react';

const PAGE_SIZE = 10;

export function BlockRewardsCard({ block }: { block: VersionedBlockResponse }) {
    const [rewardsDisplayed, setRewardsDisplayed] = React.useState(PAGE_SIZE);

    if (!block.rewards || block.rewards.length < 1) {
        return null;
    }

    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b flex items-center">
                <h3 className="text-lg font-semibold">Block Rewards</h3>
            </div>

            <div className="overflow-x-auto mb-0">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-muted-foreground">Address</th>
                            <th className="text-muted-foreground">Type</th>
                            <th className="text-muted-foreground">Amount</th>
                            <th className="text-muted-foreground">New Balance</th>
                            <th className="text-muted-foreground">Percent Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        {block.rewards.map((reward, index) => {
                            if (index >= rewardsDisplayed - 1) {
                                return null;
                            }

                            let percentChange;
                            if (reward.postBalance !== null && reward.postBalance !== 0) {
                                percentChange = (
                                    (Math.abs(reward.lamports) / (reward.postBalance - reward.lamports)) *
                                    100
                                ).toFixed(9);
                            }
                            return (
                                <tr key={reward.pubkey + reward.rewardType}>
                                    <td>
                                        <Address pubkey={new PublicKey(reward.pubkey)} link />
                                    </td>
                                    <td>{reward.rewardType}</td>
                                    <td>
                                        <SolBalance lamports={reward.lamports} />
                                    </td>
                                    <td>{reward.postBalance ? <SolBalance lamports={reward.postBalance} /> : '-'}</td>
                                    <td>{percentChange ? percentChange + '%' : '-'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {block.rewards.length > rewardsDisplayed && (
                <div className="px-6 py-4 border-t">
                    <button
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 w-full"
                        onClick={() => setRewardsDisplayed(displayed => displayed + PAGE_SIZE)}
                    >
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}
