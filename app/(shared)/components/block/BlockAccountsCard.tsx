import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Copyable } from '@/app/(shared)/components/Copyable';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Address } from '@/app/(shared)/components/Address';

interface BlockAccount {
  account: string;
  balance: bigint;
  change: 'created' | 'updated' | 'deleted';
}

interface BlockAccountsCardProps {
  accounts: BlockAccount[];
  block: {
    slot: number;
    blockhash: string;
  };
}

export function BlockAccountsCard({ accounts, block }: BlockAccountsCardProps) {
  const getChangeColor = (change: string) => {
    switch (change) {
      case 'created':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'updated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deleted':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChangeText = (change: string) => {
    switch (change) {
      case 'created':
        return 'Created';
      case 'updated':
        return 'Updated';
      case 'deleted':
        return 'Deleted';
      default:
        return 'Changed';
    }
  };

  const formatBalance = (balance: bigint) => {
    return (Number(balance) / 1e9).toFixed(9);
  };

  if (!accounts || accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">No account changes in this block</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Changes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-muted-foreground text-sm">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} affected in block {block.slot}
          </div>

          {accounts.slice(0, 20).map((account, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Account #{index + 1}</span>
                  <Badge className={getChangeColor(account.change)}>{getChangeText(account.change)}</Badge>
                </div>
                <div className="text-muted-foreground text-sm">Balance: {formatBalance(account.balance)} SOL</div>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">Address</div>
                <Address pubkey={account.account as any} link truncate />
              </div>

              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <div>
                  Block: <Copyable text={block.slot.toString()}>{block.slot.toString()}</Copyable>
                </div>
                <div>
                  <Copyable text={block.blockhash}>
                    {block.blockhash.slice(0, 8)}...{block.blockhash.slice(-8)}
                  </Copyable>
                </div>
              </div>
            </div>
          ))}

          {accounts.length > 20 && (
            <div className="text-muted-foreground py-4 text-center text-sm">
              ... and {accounts.length - 20} more account{accounts.length - 20 !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
