import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Copyable } from '@/app/(shared)/components/Copyable';
import { Badge } from '@/app/(shared)/components/ui/badge';

interface VoteInfo {
  slot: number;
  confirmationCount: number;
  lockout: number;
  vote: string;
}

interface VotesCardProps {
  account: {
    data: {
      parsed: {
        info: {
          votes: VoteInfo[];
        };
      };
    };
  };
}

export function VotesCard({ account }: VotesCardProps) {
  const votes = account?.data?.parsed?.info?.votes || [];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getConfirmationStatus = (confirmationCount: number) => {
    if (confirmationCount >= 128) {
      return { text: 'Confirmed', color: 'bg-green-100 text-green-800 border-green-200' };
    } else if (confirmationCount >= 64) {
      return { text: 'Confirming', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else {
      return { text: 'Pending', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Votes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {votes.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No votes recorded</div>
          ) : (
            <>
              <div className="text-muted-foreground text-sm">
                Showing {Math.min(votes.length, 10)} most recent vote{votes.length !== 1 ? 's' : ''}
              </div>
              {votes.slice(0, 10).map((vote, index) => {
                const status = getConfirmationStatus(vote.confirmationCount);
                return (
                  <div key={index} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Slot {vote.slot}</span>
                        <Badge className={status.color}>{status.text}</Badge>
                      </div>
                      <div className="text-muted-foreground text-sm">Vote #{votes.length - index}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Vote: </span>
                        <Copyable text={vote.vote}>
                          <span className="font-mono">{vote.vote === 'YES' ? '✓ YES' : '✗ NO'}</span>
                        </Copyable>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lockout: </span>
                        <span className="font-mono">{new Date(vote.lockout * 1000).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Confirmations: </span>
                        <span className="font-medium">{vote.confirmationCount}/128</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Est. Time: </span>
                        <span className="font-mono">{formatDate(vote.slot * 400)}</span>
                      </div>
                    </div>

                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${(vote.confirmationCount / 128) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
