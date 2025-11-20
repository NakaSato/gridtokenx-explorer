import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Copyable } from '@/app/(shared)/components/Copyable';
import { Badge } from '@/app/(shared)/components/ui/badge';

interface BlockEntry {
  slot: number;
  blockhash: string;
  timestamp: number;
  transactionCount: number;
  status: 'confirmed' | 'processing' | 'failed';
}

interface BlockHistoryCardProps {
  blocks: BlockEntry[];
}

export function BlockHistoryCard({ blocks }: BlockHistoryCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!blocks || blocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Blocks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">No blocks available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Blocks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {blocks.slice(0, 10).map((block, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Slot {block.slot}</span>
                  <Badge className={getStatusColor(block.status)}>{getStatusText(block.status)}</Badge>
                </div>
                <div className="text-muted-foreground text-sm">
                  {block.transactionCount} transaction{block.transactionCount !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Blockhash: </span>
                  <Copyable text={block.blockhash}>
                    <span className="font-mono">
                      {block.blockhash.slice(0, 16)}...{block.blockhash.slice(-16)}
                    </span>
                  </Copyable>
                </div>

                <div>
                  <span className="text-muted-foreground">Time: </span>
                  <span className="font-mono">{formatTimestamp(block.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}

          {blocks.length > 10 && (
            <div className="text-muted-foreground py-4 text-center text-sm">
              ... and {blocks.length - 10} more block{blocks.length - 10 !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
