import { Epoch } from '@/app/(shared)/components/common/Epoch';
import { SolBalance } from '@/app/(shared)/components/common/SolBalance';
import { StakeHistoryEntry, StakeHistoryInfo, SysvarAccount } from '@validators/accounts/sysvar';
import React from 'react';

export function StakeHistoryCard({ sysvarAccount }: { sysvarAccount: SysvarAccount }) {
  const stakeHistory = sysvarAccount.info as StakeHistoryInfo;
  return (
    <>
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Stake History</h3>
            </div>
          </div>
        </div>

        <div className="mb-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-muted-foreground w-1">Epoch</th>
                <th className="text-muted-foreground">Effective (SOL)</th>
                <th className="text-muted-foreground">Activating (SOL)</th>
                <th className="text-muted-foreground">Deactivating (SOL)</th>
              </tr>
            </thead>
            <tbody className="list">
              {stakeHistory.length > 0 &&
                stakeHistory.map((entry: StakeHistoryEntry, index) => {
                  return renderAccountRow(entry, index);
                })}
            </tbody>
          </table>
        </div>

        <div className="border-t px-6 py-4">
          <div className="text-muted-foreground text-center">
            {stakeHistory.length > 0 ? '' : 'No stake history found'}
          </div>
        </div>
      </div>
    </>
  );
}

const renderAccountRow = (entry: StakeHistoryEntry, index: number) => {
  return (
    <tr key={index}>
      <td className="w-1 font-mono">
        <Epoch epoch={entry.epoch} link />
      </td>
      <td className="font-mono">
        <SolBalance lamports={entry.stakeHistory.effective} />
      </td>
      <td className="font-mono">
        <SolBalance lamports={entry.stakeHistory.activating} />
      </td>
      <td className="font-mono">
        <SolBalance lamports={entry.stakeHistory.deactivating} />
      </td>
    </tr>
  );
};
