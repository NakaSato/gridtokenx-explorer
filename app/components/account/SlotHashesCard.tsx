import { Slot } from '@components/common/Slot';
import { SlotHashEntry, SlotHashesInfo, SysvarAccount } from '@validators/accounts/sysvar';
import React from 'react';

export function SlotHashesCard({ sysvarAccount }: { sysvarAccount: SysvarAccount }) {
  const slotHashes = sysvarAccount.info as SlotHashesInfo;
  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="border-b px-6 py-4">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Slot Hashes</h3>
          </div>
        </div>
      </div>

      <div className="mb-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-muted-foreground w-1">Slot</th>
              <th className="text-muted-foreground">Hash</th>
            </tr>
          </thead>
          <tbody className="list">
            {slotHashes.length > 0 &&
              slotHashes.map((entry: SlotHashEntry, index) => {
                return renderAccountRow(entry, index);
              })}
          </tbody>
        </table>
      </div>

      <div className="border-t px-6 py-4">
        <div className="text-muted-foreground text-center">{slotHashes.length > 0 ? '' : 'No hashes found'}</div>
      </div>
    </div>
  );
}

const renderAccountRow = (entry: SlotHashEntry, index: number) => {
  return (
    <tr key={index}>
      <td className="w-1 font-mono">
        <Slot slot={entry.slot} link />
      </td>
      <td className="font-mono">{entry.hash}</td>
    </tr>
  );
};
