'use client';

import { Fragment, useMemo } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/(shared)/components/ui/table';
import { Signature } from '@/app/(shared)/components/Signature';
import { Slot } from '@/app/(shared)/components/Slot';
import { TimestampToggle } from '@/app/(shared)/components/TimestampToggle';
import { PlayIcon, PauseIcon } from '@radix-ui/react-icons';

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
  programNames?: string[]; // GridTokenX programs this tx touched (by queried address)
  accountKeys?: string[];
  computeUnits?: number;
  fee?: number;
}

/** Tint classes per GridTokenX program, for the Program column badges (theme-aware). */
const PROGRAM_BADGE_CLASS: Record<string, string> = {
  Trading: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Energy Token': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  Governance: 'bg-green-500/15 text-green-400 border-green-500/20',
  Oracle: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  Registry: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  Treasury: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Blockbench: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  System: 'bg-secondary text-muted-foreground border-border/50',
};

const BADGE_BASE = 'px-2 py-0.5 text-xs font-medium border';

interface RealtimeTransactionTableProps {
  transactions: Transaction[];
  lastSlot: number | null;
  isPaused: boolean;
  detailsLoading: boolean;
  selectedTxSignature: string | null;
  onPauseToggle: () => void;
  onInspect: (tx: Transaction) => void;
  /** Signatures that arrived in the latest refresh — flash-highlighted on entry. */
  newSignatures?: Set<string>;
}

export function RealtimeTransactionTable({
  transactions,
  lastSlot,
  isPaused,
  detailsLoading,
  selectedTxSignature,
  onPauseToggle,
  onInspect,
  newSignatures,
}: RealtimeTransactionTableProps) {
  // Group consecutive rows by slot (input is already sorted newest-slot-first).
  const slotGroups = useMemo(() => {
    const groups: { slot: number; txs: Transaction[] }[] = [];
    for (const tx of transactions) {
      const last = groups[groups.length - 1];
      if (last && last.slot === tx.slot) last.txs.push(tx);
      else groups.push({ slot: tx.slot, txs: [tx] });
    }
    return groups;
  }, [transactions]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-foreground md:text-xl">Real-time Transactions</h2>
            {isPaused ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Paused
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/25 bg-green-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-green-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{transactions.length}</span> transactions
            {!isPaused && ' · streaming live'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastSlot != null && (
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Slot</span>
              <span className="font-mono text-sm font-semibold text-cyan-400">
                <Slot slot={lastSlot} link />
              </span>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400/70" />
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onPauseToggle}
            className="h-9 min-w-[104px] border-border/50 bg-transparent font-semibold transition-colors hover:border-cyan-500/30 hover:text-foreground"
          >
            {isPaused ? (
              <>
                <PlayIcon className="mr-1.5 h-4 w-4" />
                Resume
              </>
            ) : (
              <>
                <PauseIcon className="mr-1.5 h-4 w-4" />
                Pause
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border/50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 bg-secondary/30 hover:bg-secondary/30">
                <TableHead className="text-muted-foreground">Signature</TableHead>
                <TableHead className="text-muted-foreground">Program</TableHead>
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Confirmations</TableHead>
                <TableHead className="text-right text-muted-foreground">Inspect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slotGroups.map(group => (
                <Fragment key={group.slot}>
                  <TableRow className="border-border/40 bg-secondary/40 hover:bg-secondary/40">
                    <TableCell colSpan={6} className="py-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400/70" />
                        Slot
                        <span className="font-mono text-cyan-400">
                          <Slot slot={group.slot} link />
                        </span>
                        <span className="font-normal normal-case text-muted-foreground/60">
                          · {group.txs.length} tx
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {group.txs.map(tx => (
                <TableRow
                  key={tx.signature}
                  className={`border-border/30 transition-colors hover:bg-secondary/20 ${
                    newSignatures?.has(tx.signature) ? 'animate-tx-row-enter' : ''
                  }`}
                >
                  <TableCell className="font-mono text-sm text-cyan-400">
                    <Signature signature={tx.signature} link truncateChars={48} />
                  </TableCell>
                  <TableCell>
                    {tx.programNames && tx.programNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tx.programNames.map(name => (
                          <Badge
                            key={name}
                            variant="outline"
                            className={`${BADGE_BASE} ${PROGRAM_BADGE_CLASS[name] ?? PROGRAM_BADGE_CLASS.System}`}
                          >
                            {name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {tx.blockTime ? (
                      // Solana blockTime is in seconds → ms for Date
                      <TimestampToggle unixTimestamp={tx.blockTime * 1000} shorter />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tx.err ? (
                      <Badge variant="outline" className={`${BADGE_BASE} bg-red-500/15 text-red-400 border-red-500/20`}>
                        Failed
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`${BADGE_BASE} bg-green-500/15 text-green-400 border-green-500/20`}
                      >
                        Success
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {tx.confirmationStatus === 'finalized' ? (
                      <Badge
                        variant="outline"
                        className={`${BADGE_BASE} bg-green-500/15 text-green-400 border-green-500/20`}
                      >
                        Finalized
                      </Badge>
                    ) : tx.confirmationStatus === 'confirmed' ? (
                      <Badge
                        variant="outline"
                        className={`${BADGE_BASE} bg-cyan-500/15 text-cyan-400 border-cyan-500/20`}
                      >
                        Confirmed
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`${BADGE_BASE} bg-amber-500/15 text-amber-400 border-amber-500/20`}
                      >
                        Processed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onInspect(tx)}
                      disabled={detailsLoading && selectedTxSignature === tx.signature}
                      className="min-w-[84px] border-border/50 bg-transparent transition-colors hover:border-cyan-500/30 hover:text-cyan-400"
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
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
