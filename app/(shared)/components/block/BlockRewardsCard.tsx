import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Copyable } from '@/app/(shared)/components/Copyable';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Address } from '@/app/(shared)/components/Address';

interface RewardInfo {
  pubkey: string;
  lamports: number;
  postBalance: bigint;
  rewardType: 'fee' | 'rent' | 'staking' | 'vote' | 'other';
  commission?: number;
}

interface BlockRewardsCardProps {
  rewards: RewardInfo[];
  block: {
    slot: number;
    blockhash: string;
  };
}

export function BlockRewardsCard({ rewards, block }: BlockRewardsCardProps) {
  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'fee':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rent':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'staking':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'vote':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRewardTypeText = (type: string) => {
    switch (type) {
      case 'fee':
        return 'Fee';
      case 'rent':
        return 'Rent';
      case 'staking':
        return 'Staking';
      case 'vote':
        return 'Vote';
      default:
        return 'Other';
    }
  };

  const formatLamports = (lamports: number) => {
    const sol = lamports / 1e9;
    if (Math.abs(sol) >= 1) {
      return `${sol.toFixed(9)} SOL`;
    } else {
      return `${lamports} lamports`;
    }
  };

  const getTotalRewards = () => {
    return rewards.reduce((total, reward) => total + reward.lamports, 0);
  };

  const getTotalRewardsByType = (type: string) => {
    return rewards.filter(reward => reward.rewardType === type).reduce((total, reward) => total + reward.lamports, 0);
  };

  if (!rewards || rewards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Block Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">No rewards distributed in this block</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Block Rewards</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Rewards: </span>
              <span className="font-medium">{formatLamports(getTotalRewards())}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Recipients: </span>
              <span className="font-medium">{rewards.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Fees: </span>
              <span>{formatLamports(getTotalRewardsByType('fee'))}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Staking: </span>
              <span>{formatLamports(getTotalRewardsByType('staking'))}</span>
            </div>
          </div>

          {rewards.slice(0, 20).map((reward, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Recipient #{index + 1}</span>
                  <Badge className={getRewardTypeColor(reward.rewardType)}>
                    {getRewardTypeText(reward.rewardType)}
                  </Badge>
                </div>
                <div className={`text-sm font-medium ${reward.lamports >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reward.lamports >= 0 ? '+' : ''}
                  {formatLamports(reward.lamports)}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Address: </span>
                  <div className="flex items-center gap-2">
                    <Address pubkey={reward.pubkey as any} link truncate />
                    {reward.commission && (
                      <Badge variant="outline" className="text-xs">
                        {reward.commission}% fee
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground text-xs">Reward: </span>
                    <span className={`font-mono ${reward.lamports >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reward.lamports >= 0 ? '+' : ''}
                      {reward.lamports} lamports
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Post Balance: </span>
                    <span className="font-mono">{(Number(reward.postBalance) / 1e9).toFixed(9)} SOL</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {rewards.length > 20 && (
            <div className="text-muted-foreground py-4 text-center text-sm">
              ... and {rewards.length - 20} more reward{rewards.length - 20 !== 1 ? 's' : ''}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="text-muted-foreground text-xs">
              Block: <Copyable text={block.slot.toString()}>{block.slot.toString()}</Copyable>
              {' • '}
              Hash:{' '}
              <Copyable text={block.blockhash}>
                {block.blockhash.slice(0, 8)}...{block.blockhash.slice(-8)}
              </Copyable>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
