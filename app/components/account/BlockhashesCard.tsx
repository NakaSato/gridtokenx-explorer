import { RecentBlockhashesEntry, RecentBlockhashesInfo } from '@validators/accounts/sysvar';
import React from 'react';

export function BlockhashesCard({ blockhashes }: { blockhashes: RecentBlockhashesInfo }) {
  return (
    <>
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Blockhashes</h3>
            </div>
          </div>
        </div>

        <div className="mb-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-muted-foreground w-1">Recency</th>
                <th className="text-muted-foreground w-1">Blockhash</th>
                <th className="text-muted-foreground">Fee Calculator</th>
              </tr>
            </thead>
            <tbody className="list">
              {blockhashes.length > 0 &&
                blockhashes.map((entry: RecentBlockhashesEntry, index) => {
                  return renderAccountRow(entry, index);
                })}
            </tbody>
          </table>
        </div>

        <div className="border-t px-6 py-4">
          <div className="text-muted-foreground text-center">
            {blockhashes.length > 0 ? '' : 'No blockhashes found'}
          </div>
        </div>
      </div>
    </>
  );
}

const renderAccountRow = (entry: RecentBlockhashesEntry, index: number) => {
  return (
    <tr key={index}>
      <td className="w-1">{index + 1}</td>
      <td className="w-1 font-mono">{entry.blockhash}</td>
      <td className="">{entry.feeCalculator.lamportsPerSignature} lamports per signature</td>
    </tr>
  );
};
