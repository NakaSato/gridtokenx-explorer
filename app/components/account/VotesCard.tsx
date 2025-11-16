import { Slot } from '@components/common/Slot';
import { Vote, VoteAccount } from '@validators/accounts/vote';
import React from 'react';

export function VotesCard({ voteAccount }: { voteAccount: VoteAccount }) {
  return (
    <>
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Vote History</h3>
            </div>
          </div>
        </div>

        <div className="mb-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-muted-foreground w-1">Slot</th>
                <th className="text-muted-foreground">Confirmation Count</th>
              </tr>
            </thead>
            <tbody className="list">
              {voteAccount.info.votes.length > 0 &&
                voteAccount.info.votes.reverse().map((vote: Vote, index) => renderAccountRow(vote, index))}
            </tbody>
          </table>
        </div>

        <div className="border-t px-6 py-4">
          <div className="text-muted-foreground text-center">
            {voteAccount.info.votes.length > 0 ? '' : 'No votes found'}
          </div>
        </div>
      </div>
    </>
  );
}

const renderAccountRow = (vote: Vote, index: number) => {
  return (
    <tr key={index}>
      <td className="w-1 font-mono">
        <Slot slot={vote.slot} link />
      </td>
      <td className="font-mono">{vote.confirmationCount}</td>
    </tr>
  );
};
