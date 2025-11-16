'use client';

import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/shared/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/shared/ui/tooltip';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { TimestampToggle } from '@components/common/TimestampToggle';
import { PlayIcon, PauseIcon, UpdateIcon } from '@radix-ui/react-icons';

/**
 * Transaction signature information
 * Represents a confirmed transaction signature with status and metadata
 */
export interface TransactionSignatureInfo {
  signature: string;
  slot: number;
  err: any | null;
  memo: string | null;
  blockTime: number | null;
  confirmationStatus?: 'processed' | 'confirmed' | 'finalized';
}

/**
 * Enhanced transaction with additional details
 * Extends basic signature info with full transaction details and metadata
 */
export interface Transaction extends TransactionSignatureInfo {
  details?: any | null; // Full transaction response when fetched
  programIds?: string[];
  accountKeys?: string[];
  computeUnits?: number;
  fee?: number;
}

interface RealtimeTransactionTableProps {
  transactions: Transaction[];
  lastSlot: number | null;
  isPaused: boolean;
  detailsLoading: boolean;
  selectedTxSignature: string | null;
  refreshInterval: number;
  onPauseToggle: () => void;
  onInspect: (tx: Transaction) => void;
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
      <CardHeader className="space-y-4 bg-gradient-to-r from-background to-muted/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl font-bold">Real-time Transactions</CardTitle>
              {!isPaused && (
                <Badge
                  variant="outline"
                  className="animate-pulse border-green-500 bg-green-50 px-3 py-1 text-green-700 shadow-sm transition-all hover:bg-green-100 dark:bg-green-950 dark:text-green-400"
                >
                  <span
                    className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-600 dark:bg-green-400"
                    role="status"
                    aria-label="Live updates active"
                  />
                  LIVE
                </Badge>
              )}
              {isPaused && (
                <Badge variant="secondary" className="px-3 py-1 shadow-sm">
                  ⏸ Paused
                </Badge>
              )}
            </div>
            <CardDescription className="flex flex-wrap items-center gap-2 text-base">
              <span>
                Showing the latest <strong className="text-foreground">{transactions.length}</strong> transactions
              </span>
              {!isPaused && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-muted-foreground">
                    Updates every <strong className="text-foreground">{refreshInterval / 1000}s</strong>
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          <TooltipProvider>
            <div className="flex flex-wrap items-center gap-3">
              {lastSlot && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group relative flex items-center justify-between gap-3 rounded-xl border bg-gradient-to-r from-background/80 to-background/60 px-4 py-3 text-sm shadow-lg backdrop-blur-md transition-all duration-300 hover:from-background hover:to-background/90 hover:shadow-xl hover:border-primary/20 hover:scale-[1.02] min-w-[200px]">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="relative flex items-center gap-3 flex-1">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <UpdateIcon className="h-4 w-4 text-primary group-hover:rotate-180 transition-transform duration-500" />
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">Current Slot</span>
                          <div className="font-mono font-semibold text-foreground truncate">
                            <Slot slot={lastSlot} link />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse opacity-75" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-popover/95 backdrop-blur-sm border-primary/20">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">Latest blockchain slot</p>
                      <p className="text-xs text-muted-foreground">Slot {lastSlot.toLocaleString()}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isPaused ? 'default' : 'outline'}
                    size="default"
                    onClick={onPauseToggle}
                    className="min-w-[120px] font-semibold shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {isPaused ? (
                      <>
                        <PlayIcon className="mr-2 h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <PauseIcon className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isPaused ? 'Resume real-time updates' : 'Pause real-time updates'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
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
                    // Solana blockTime is in seconds, multiply by 1000 to convert to milliseconds for Date
                    <TimestampToggle unixTimestamp={tx.blockTime * 1000} shorter />
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
