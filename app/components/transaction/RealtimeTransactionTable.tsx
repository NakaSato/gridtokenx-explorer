'use client';

import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/shared/ui/table';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { TimestampToggle } from '@components/common/TimestampToggle';
import { ConfirmedSignatureInfo, VersionedTransactionResponse } from '@solana/web3.js';
import React from 'react';

export interface EnhancedTransaction extends ConfirmedSignatureInfo {
  details?: VersionedTransactionResponse | null;
  programIds?: string[];
  accountKeys?: string[];
  computeUnits?: number;
  fee?: number;
}

interface RealtimeTransactionTableProps {
  transactions: EnhancedTransaction[];
  lastSlot: number | null;
  isPaused: boolean;
  detailsLoading: boolean;
  selectedTxSignature: string | null;
  refreshInterval: number;
  onPauseToggle: () => void;
  onInspect: (tx: EnhancedTransaction) => void;
}

export function RealtimeTransactionTable({
  transactions,
  lastSlot,
  isPaused,
  detailsLoading,
  selectedTxSignature,
  refreshInterval,
  onPauseToggle,
  onInspect,
}: RealtimeTransactionTableProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-1.5">
            <CardTitle className="text-xl">Real-time Transactions</CardTitle>
            <CardDescription className="text-base">
              Showing the latest {transactions.length} transactions. Updates every {refreshInterval / 1000} seconds when
              not paused.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {lastSlot && (
              <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <span>Current Slot:</span>
                <Slot slot={lastSlot} link />
              </div>
            )}
            {!isPaused && (
              <Badge
                variant="outline"
                className="border-green-200 bg-green-50 text-green-700 transition-colors hover:bg-green-100"
              >
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-green-600 border-t-transparent"
                  role="status"
                  aria-label="Live updates active"
                />
                Live
              </Badge>
            )}
            <Button
              variant={isPaused ? 'default' : 'outline'}
              size="sm"
              onClick={onPauseToggle}
              className="min-w-[100px]"
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Signature</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confirmations</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx, index) => (
              <TableRow key={`${tx.signature}-${index}`} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-mono text-sm">
                  <Signature signature={tx.signature} link truncateChars={48} />
                </TableCell>
                <TableCell className="font-mono">
                  <Slot slot={tx.slot} link />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {tx.blockTime ? (
                    <TimestampToggle unixTimestamp={tx.blockTime} shorter />
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {tx.err ? (
                    <Badge variant="destructive" className="font-medium">
                      Failed
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-100 font-medium text-green-700 hover:bg-green-100">
                      Success
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {tx.confirmationStatus === 'finalized' ? (
                    <Badge variant="default" className="bg-green-100 font-medium text-green-800 hover:bg-green-100">
                      Finalized
                    </Badge>
                  ) : tx.confirmationStatus === 'confirmed' ? (
                    <Badge variant="secondary" className="bg-blue-100 font-medium text-blue-800 hover:bg-blue-100">
                      Confirmed
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 font-medium text-yellow-800 hover:bg-yellow-100"
                    >
                      Processed
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onInspect(tx)}
                    disabled={detailsLoading && selectedTxSignature === tx.signature}
                    className="min-w-[80px]"
                  >
                    {detailsLoading && selectedTxSignature === tx.signature ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      'Inspect'
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
