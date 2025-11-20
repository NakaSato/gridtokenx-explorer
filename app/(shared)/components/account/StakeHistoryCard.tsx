import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Copyable } from '@/app/(shared)/components/Copyable';
import { Badge } from '@/app/(shared)/components/ui/badge';

interface StakeEntry {
  epoch: number;
  stake: bigint;
  effective: bigint;
  activating: bigint;
  deactivating: bigint;
}

interface StakeHistoryCardProps {
  account: {
    data: {
      parsed: {
        info: {
          stakeHistory: StakeEntry[];
        };
      };
    };
  };
}

export function StakeHistoryCard({ account }: StakeHistoryCardProps) {
  const stakeHistory = account?.data?.parsed?.info?.stakeHistory || [];

  const getStakeStatusColor = (entry: StakeEntry) => {
    if (entry.activating > 0) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (entry.deactivating > 0) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStakeStatusText = (entry: StakeEntry) => {
    if (entry.activating > 0) return 'Activating';
    if (entry.deactivating > 0) return 'Deactivating';
    return 'Active';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stake History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stakeHistory.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No stake history available</div>
          ) : (
            stakeHistory.map((entry, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Epoch {entry.epoch}</span>
                    <Badge className={getStakeStatusColor(entry)}>{getStakeStatusText(entry)}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Effective: </span>
                      <span className="font-mono">{(Number(entry.effective) / 1e9).toFixed(9)} SOL</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-mono">{(Number(entry.stake) / 1e9).toFixed(9)} SOL</span>
                    </div>
                  </div>
                  {entry.activating > 0 && (
                    <div className="text-sm text-yellow-600">
                      Activating: {(Number(entry.activating) / 1e9).toFixed(9)} SOL
                    </div>
                  )}
                  {entry.deactivating > 0 && (
                    <div className="text-sm text-red-600">
                      Deactivating: {(Number(entry.deactivating) / 1e9).toFixed(9)} SOL
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
