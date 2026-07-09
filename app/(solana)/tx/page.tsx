'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useCluster } from '@/app/(core)/providers/cluster';
import { RealtimeTransactionTable, Transaction } from '@/app/(features)/transactions/components/RealtimeTransactionTable';
import { Alert, AlertDescription } from '@/app/(shared)/components/ui/alert';
import { TransactionDetailsCard } from '@/app/(features)/transactions/components/TransactionDetailsCard';
import { ConfirmedSignatureInfo, Connection, PublicKey } from '@solana/web3.js';
import { ALL_PROGRAM_IDS, PROGRAM_NAME_BY_ID } from '@/app/(features)/anchor-localnet/config';
import { Input } from '@/app/(shared)/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(shared)/components/ui/select';
import { Clock, Search, X, CheckCircle2, XCircle, Gauge, Activity } from 'lucide-react';

// One-time history backfill on load/resume (no polling after — new txs arrive
// over the RPC WebSocket via onLogs).
const BACKFILL_LIMIT = 25;
// Ring-buffer cap: keep only the newest N in memory so an all-day live stream
// can't grow unbounded. Older rows fall off the tail.
const LIST_CAP = 500;
const PAGE_SIZE = 25;
const VOTE_PROGRAM = 'Vote111111111111111111111111111111111111111';

type StatusFilter = 'all' | 'success' | 'failed';

interface SearchTarget {
  id: string;
  name: string;
}

export default function TransactionsPage() {
  const { url } = useCluster();
  const connection = useMemo(() => {
    if (!url || (!url.startsWith('http:') && !url.startsWith('https:'))) {
      return null;
    }
    return new Connection(url);
  }, [url]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastSlot, setLastSlot] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Signatures added by the latest refresh — drives the row flash animation.
  const [newSignatures, setNewSignatures] = useState<Set<string>>(new Set());
  const seenSigsRef = useRef<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);

  // Filters
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');

  // Programs to watch, tagged by name. A tx touching several fires under each.
  // Localnet: only the GridTokenX programs — the System program is a per-slot
  // firehose of validator housekeeping that would bury real app activity in a
  // live (uncapped) stream. Mainnet: Vote, as before.
  const buildTargets = useCallback((): SearchTarget[] => {
    if (!connection) return [];
    const isMainnet = connection.rpcEndpoint.includes('mainnet');
    return isMainnet
      ? [{ id: VOTE_PROGRAM, name: 'Vote' }]
      : ALL_PROGRAM_IDS.map(id => ({ id, name: PROGRAM_NAME_BY_ID[id] ?? 'Program' }));
  }, [connection]);

  // Merge incoming txs into the list: union program names, keep any details we
  // already fetched, prefer a real blockTime, newest slot first. Genuinely new
  // signatures (never seen before) are flash-highlighted when `flash` is set.
  const upsert = useCallback((incoming: Transaction[], flash: boolean) => {
    if (incoming.length === 0) return;
    const seen = seenSigsRef.current;
    const freshSigs: string[] = [];
    for (const tx of incoming) {
      if (!seen.has(tx.signature)) {
        seen.add(tx.signature);
        freshSigs.push(tx.signature);
      }
    }

    setTransactions(prev => {
      const map = new Map(prev.map(t => [t.signature, t] as const));
      for (const tx of incoming) {
        const old = map.get(tx.signature);
        if (old) {
          const names = new Set([...(old.programNames ?? []), ...(tx.programNames ?? [])]);
          map.set(tx.signature, {
            ...old,
            ...tx,
            programNames: Array.from(names),
            // never lose already-inspected analytics or a resolved blockTime
            details: old.details,
            fee: old.fee,
            computeUnits: old.computeUnits,
            blockTime: tx.blockTime ?? old.blockTime,
          });
        } else {
          map.set(tx.signature, tx);
        }
      }
      // Newest first, then trim to the ring-buffer cap.
      return Array.from(map.values())
        .sort((a, b) => b.slot - a.slot)
        .slice(0, LIST_CAP);
    });

    if (flash && hasLoadedRef.current && freshSigs.length > 0) {
      setNewSignatures(prev => new Set([...prev, ...freshSigs]));
    }
  }, []);

  // Batch live events: onLogs can fire many times per slot. Buffer arrivals and
  // flush once per animation frame → one re-render/frame instead of one per tx.
  const pendingRef = useRef<Transaction[]>([]);
  const rafRef = useRef<number | null>(null);
  const flushPending = useCallback(() => {
    rafRef.current = null;
    const batch = pendingRef.current;
    pendingRef.current = [];
    if (batch.length > 0) upsert(batch, true);
  }, [upsert]);
  const enqueue = useCallback(
    (tx: Transaction) => {
      pendingRef.current.push(tx);
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flushPending);
      }
    },
    [flushPending]
  );

  // One-time history load so the page isn't empty before live events arrive.
  const backfill = useCallback(async () => {
    if (!connection) return;
    try {
      setError(null);
      const slot = await connection.getSlot();
      setLastSlot(slot);

      const targets = buildTargets();
      const results = await Promise.all(
        targets.map(t =>
          connection
            .getSignaturesForAddress(new PublicKey(t.id), { limit: BACKFILL_LIMIT })
            .then(sigs => sigs.map(s => ({ sig: s, program: t.name })))
            .catch(e => {
              console.warn(`Failed to backfill signatures for ${t.name} (${t.id}):`, e);
              return [] as { sig: ConfirmedSignatureInfo; program: string }[];
            })
        )
      );

      const bySig = new Map<string, { sig: ConfirmedSignatureInfo; programs: Set<string> }>();
      for (const { sig, program } of results.flat()) {
        const existing = bySig.get(sig.signature);
        if (existing) existing.programs.add(program);
        else bySig.set(sig.signature, { sig, programs: new Set([program]) });
      }

      const txs: Transaction[] = Array.from(bySig.values()).map(({ sig, programs }) => ({
        signature: sig.signature,
        slot: sig.slot,
        err: sig.err,
        memo: sig.memo || null,
        blockTime: sig.blockTime || null,
        confirmationStatus: sig.confirmationStatus,
        programNames: Array.from(programs),
      }));

      upsert(txs, false); // no flash for historical rows
      hasLoadedRef.current = true;
      setIsLoading(false);
    } catch (err) {
      console.error('Error backfilling transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      setIsLoading(false);
    }
  }, [connection, buildTargets, upsert]);

  // Fetch transaction details
  const handleInspect = useCallback(
    async (tx: Transaction) => {
      if (!connection) return;

      setSelectedTx(tx);
      setDetailsLoading(true);

      try {
        const details = await connection.getParsedTransaction(tx.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (details) {
          setTransactions(prev =>
            prev.map(t =>
              t.signature === tx.signature
                ? {
                    ...t,
                    details,
                    fee: details.meta?.fee,
                    computeUnits: details.meta?.computeUnitsConsumed,
                  }
                : t
            )
          );

          setSelectedTx({
            ...tx,
            details,
            fee: details.meta?.fee,
            computeUnits: details.meta?.computeUnitsConsumed,
          });
        }
      } catch (err) {
        console.error('Error fetching transaction details:', err);
      } finally {
        setDetailsLoading(false);
      }
    },
    [connection]
  );

  const handlePauseToggle = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Live stream: backfill history once, then subscribe to program logs over the
  // RPC WebSocket. New transactions push in as they confirm — no polling.
  useEffect(() => {
    if (!connection || isPaused) return;
    let cancelled = false;
    const subIds: number[] = [];

    backfill();

    const targets = buildTargets();
    for (const t of targets) {
      try {
        const id = connection.onLogs(
          new PublicKey(t.id),
          (logs, ctx) => {
            if (cancelled || !logs.signature) return;
            const tx: Transaction = {
              signature: logs.signature,
              slot: ctx.slot,
              err: logs.err,
              memo: null,
              blockTime: null,
              confirmationStatus: 'confirmed',
              programNames: [t.name],
            };
            enqueue(tx);
            setLastSlot(prev => (prev == null || ctx.slot > prev ? ctx.slot : prev));
            // Resolve the block time for the Time column without blocking the row.
            connection
              .getBlockTime(ctx.slot)
              .then(bt => {
                if (!cancelled && bt) enqueue({ ...tx, blockTime: bt });
              })
              .catch(() => {});
          },
          'confirmed'
        );
        subIds.push(id);
      } catch (e) {
        console.warn(`onLogs subscribe failed for ${t.name}:`, e);
      }
    }

    const slotSub = connection.onSlotChange(s => {
      if (!cancelled) setLastSlot(s.slot);
    });

    return () => {
      cancelled = true;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingRef.current = [];
      subIds.forEach(id => connection.removeOnLogsListener(id).catch(() => {}));
      connection.removeSlotChangeListener(slotSub).catch(() => {});
    };
  }, [connection, isPaused, backfill, buildTargets, enqueue]);

  // Drop the "new" flag once the flash animation (2.2s) has played out.
  useEffect(() => {
    if (newSignatures.size === 0) return;
    const t = setTimeout(() => setNewSignatures(new Set()), 2400);
    return () => clearTimeout(t);
  }, [newSignatures]);

  // Programs actually present in the current sample (for the filter dropdown)
  const availablePrograms = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(tx => tx.programNames?.forEach(n => set.add(n)));
    return Array.from(set).sort();
  }, [transactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter(tx => {
      if (statusFilter === 'success' && tx.err) return false;
      if (statusFilter === 'failed' && !tx.err) return false;
      if (programFilter !== 'all' && !(tx.programNames ?? []).includes(programFilter)) return false;
      if (q && !tx.signature.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [transactions, statusFilter, programFilter, query]);

  // Header stat tiles derived from the current (unfiltered) sample
  const stats = useMemo(() => {
    const total = transactions.length;
    const success = transactions.filter(tx => !tx.err).length;
    const failed = total - success;
    const successRate = total > 0 ? (success / total) * 100 : 0;
    const times = transactions.map(tx => tx.blockTime).filter((t): t is number => t != null);
    let tps = 0;
    if (times.length > 1) {
      const range = Math.max(...times) - Math.min(...times);
      if (range > 0) tps = total / range;
    }
    return { total, success, failed, successRate, tps };
  }, [transactions]);

  // Pagination — render only the current page so the DOM stays small even as the
  // live buffer fills toward LIST_CAP.
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  useEffect(() => {
    // Snap back to the first page whenever the filtered set changes shape.
    setPage(1);
  }, [query, statusFilter, programFilter]);
  const pageTransactions = useMemo(
    () => filteredTransactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredTransactions, currentPage]
  );

  const hasActiveFilters = query !== '' || statusFilter !== 'all' || programFilter !== 'all';
  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setProgramFilter('all');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed grid background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.02] animate-grid-energy"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <main className="relative px-6 py-8 md:px-12 lg:px-16">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transactions</h1>
          </div>

          {/* Stat tiles */}
          <div
            className="grid grid-cols-2 gap-3 animate-tx-fade-in-up lg:grid-cols-4"
            style={{ animationDelay: '60ms' }}
          >
          <StatTile
            icon={<Activity className="h-4 w-4" />}
            label="Transactions"
            value={stats.total.toString()}
            hint="live stream"
            accent="text-cyan-400"
          />
          <StatTile
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Success Rate"
            value={`${stats.successRate.toFixed(0)}%`}
            hint={`${stats.success} / ${stats.total}`}
            accent="text-green-400"
          />
          <StatTile
            icon={<XCircle className="h-4 w-4" />}
            label="Failed"
            value={stats.failed.toString()}
            hint="in sample"
            accent="text-red-400"
          />
          <StatTile
            icon={<Gauge className="h-4 w-4" />}
            label="Est. TPS"
            value={stats.tps > 0 ? stats.tps.toFixed(2) : '—'}
            hint="this sample"
            accent="text-blue-400"
          />
        </div>

          {/* Filter bar */}
          <div
            className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/30 p-3 animate-tx-fade-in-up md:flex-row md:items-center"
            style={{ animationDelay: '120ms' }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by signature…"
                className="border-border/50 bg-secondary/30 pl-9 focus-visible:border-cyan-500/40"
              />
            </div>

            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full border-border/50 bg-secondary/30 md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-full border-border/50 bg-secondary/30 md:w-[180px]">
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {availablePrograms.map(name => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-cyan-500/30 hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}

            {newSignatures.size > 0 && (
              <div className="flex animate-tx-slide-in-right items-center gap-1.5 rounded-lg bg-green-500/15 px-3 py-2 text-xs font-bold text-green-400">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-400" />
                +{newSignatures.size} new
              </div>
            )}

            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="font-mono font-bold text-cyan-400">{lastSlot?.toLocaleString() ?? '…'}</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-400">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Content Area */}
          {isLoading ? (
            <div className="rounded-xl border border-border/50 bg-card/30 p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-400 border-r-transparent align-[-0.125em]" />
              <p className="mt-4 font-medium text-muted-foreground">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden p-4 md:p-6">
                <RealtimeTransactionTable
                  transactions={pageTransactions}
                  lastSlot={lastSlot}
                  isPaused={isPaused}
                  detailsLoading={detailsLoading}
                  selectedTxSignature={selectedTx?.signature || null}
                  onPauseToggle={handlePauseToggle}
                  onInspect={handleInspect}
                  newSignatures={newSignatures}
                />

                {/* Pagination */}
                <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border/50 pt-4 sm:flex-row">
                  <span className="text-xs text-muted-foreground">
                    Showing{' '}
                    <span className="font-semibold text-foreground">
                      {(currentPage - 1) * PAGE_SIZE + 1}–
                      {Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)}
                    </span>{' '}
                    of <span className="font-semibold text-foreground">{filteredTransactions.length}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-cyan-500/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="font-mono text-xs text-muted-foreground">
                      Page <span className="font-bold text-cyan-400">{currentPage}</span> / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-cyan-500/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {selectedTx && selectedTx.details ? (
                  <TransactionDetailsCard tx={selectedTx} onClose={() => setSelectedTx(null)} />
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/30 p-12 text-center">
                    <div className="mb-4 rounded-full bg-secondary/50 p-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-bold text-foreground">No Transaction Selected</h3>
                    <p className="mt-2 max-w-[240px] text-sm text-muted-foreground">
                      Select a transaction from the table above to view detailed instructions and logs.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/30 p-12 text-center">
              <h3 className="mb-3 text-lg font-bold text-foreground">
                {hasActiveFilters ? 'No Matching Transactions' : 'No Transactions Found'}
              </h3>
              {hasActiveFilters ? (
                <div className="space-y-4">
                  <p className="mx-auto max-w-md text-muted-foreground">
                    No transactions in the current sample match your filters.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mx-auto flex items-center gap-1.5 rounded-lg border border-border/50 bg-secondary/30 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-cyan-500/30 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                    Clear filters
                  </button>
                </div>
              ) : (
                <p className="mx-auto max-w-md text-muted-foreground">
                  No recent transactions available.{' '}
                  {url?.includes('localhost') || url?.includes('127.0.0.1')
                    ? 'Ensure your local Solana validator is running and there is activity on the GridTokenX programs.'
                    : 'This could be due to network conditions or RPC limitations.'}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent: string;
}

function StatTile({ icon, label, value, hint, accent }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-4 transition-colors hover:border-cyan-500/30">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className={accent}>{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className={`mt-2 font-mono text-2xl font-black ${accent}`}>
        {/* key on value → remount replays the pop when the number changes */}
        <span key={value} className="animate-tx-stat-pop">
          {value}
        </span>
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
