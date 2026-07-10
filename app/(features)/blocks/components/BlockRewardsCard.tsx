import { Address as AddressComponent } from '@/app/(shared)/components/common/Address';
import { SolBalance } from '@/app/(shared)/components/SolBalance';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/(shared)/components/ui/table';
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>New Balance</TableHead>
            <TableHead>Percent Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {block.rewards.map((reward, index) => {
            if (index >= rewardsDisplayed - 1) {
              return null;
            }

            let percentChange;
            // lamports/postBalance may be bigint from the kit RPC — coerce before math.
            const lamports = Number(reward.lamports);
            const postBalance = Number(reward.postBalance);
            if (reward.postBalance !== null && postBalance !== 0) {
              percentChange = ((Math.abs(lamports) / (postBalance - lamports)) * 100).toFixed(9);
            }
            return (
              <TableRow key={reward.pubkey + reward.rewardType}>
                <TableCell>
                  <AddressComponent pubkey={addressToPublicKey(toAddress(reward.pubkey))} link />
                </TableCell>
                <TableCell>{reward.rewardType}</TableCell>
                <TableCell>
                  <SolBalance lamports={reward.lamports} />
                </TableCell>
                <TableCell>{reward.postBalance ? <SolBalance lamports={reward.postBalance} /> : '-'}</TableCell>
                <TableCell>{percentChange ? percentChange + '%' : '-'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

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
