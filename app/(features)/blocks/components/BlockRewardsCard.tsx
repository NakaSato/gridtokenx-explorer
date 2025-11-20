import { Address as AddressComponent } from '@/app/(shared)/components/common/Address';
import { SolBalance } from '@/app/(shared)/components/common/SolBalance';
import { toAddress, addressToPublicKey } from '@/app/(shared)/utils/rpc';
import { VersionedBlockResponse } from '@solana/web3.js';
import React from 'react';

const PAGE_SIZE = 10;

export function BlockRewardsCard({ block }: { block: VersionedBlockResponse }) {
  const [rewardsDisplayed, setRewardsDisplayed] = React.useState(PAGE_SIZE);

  if (!block.rewards || block.rewards.length < 1) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex items-center border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Block Rewards</h3>
      </div>

      <div className="mb-0 overflow-x-auto">
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
                percentChange = ((Math.abs(reward.lamports) / (reward.postBalance - reward.lamports)) * 100).toFixed(9);
              }
              return (
                <tr key={reward.pubkey + reward.rewardType}>
                  <td>
                    <AddressComponent pubkey={addressToPublicKey(toAddress(reward.pubkey))} link />
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
        <div className="border-t px-6 py-4">
          <button
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2"
            onClick={() => setRewardsDisplayed(displayed => displayed + PAGE_SIZE)}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
