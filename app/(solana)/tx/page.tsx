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

const REFRESH_INTERVAL = 5000; // 5 seconds
const MAX_TRANSACTIONS = 25;
const SYSTEM_PROGRAM = '11111111111111111111111111111111';
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

  // Fetch latest transactions, tagged by the program address they were found under.
  const fetchTransactions = useCallback(async () => {
    if (!connection || isPaused) return;

    try {
      setError(null);

      const slot = await connection.getSlot();
      setLastSlot(slot);

      const isMainnet = connection.rpcEndpoint.includes('mainnet');
      const targets: SearchTarget[] = isMainnet
        ? [{ id: VOTE_PROGRAM, name: 'Vote' }]
        : [
            { id: SYSTEM_PROGRAM, name: 'System' },
            ...ALL_PROGRAM_IDS.map(id => ({ id, name: PROGRAM_NAME_BY_ID[id] ?? 'Program' })),
          ];

      // Fetch per target; keep the program name alongside each signature.
      const results = await Promise.all(
        targets.map(t =>
          connection
            .getSignaturesForAddress(new PublicKey(t.id), { limit: MAX_TRANSACTIONS })
            .then(sigs => sigs.map(s => ({ sig: s, program: t.name })))
            .catch(e => {
              console.warn(`Failed to fetch signatures for ${t.name} (${t.id}):`, e);
              return [] as { sig: ConfirmedSignatureInfo; program: string }[];
            })
        )
      );

      // Dedupe by signature; a tx can appear under several programs — collect all names.
      const bySig = new Map<string, { sig: ConfirmedSignatureInfo; programs: Set<string> }>();
      for (const { sig, program } of results.flat()) {
        const existing = bySig.get(sig.signature);
        if (existing) {
          existing.programs.add(program);
        } else {
          bySig.set(sig.signature, { sig, programs: new Set([program]) });
        }
      }

      const txs: Transaction[] = Array.from(bySig.values())
        .sort((a, b) => b.sig.slot - a.sig.slot)
        .slice(0, MAX_TRANSACTIONS)
        .map(({ sig, programs }) => ({
          signature: sig.signature,
          slot: sig.slot,
          err: sig.err,
          memo: sig.memo || null,
          blockTime: sig.blockTime || null,
          confirmationStatus: sig.confirmationStatus,
          programNames: Array.from(programs),
        }));

      // Flag signatures not seen before. Skip the flash on the very first load
      // (everything would flash at once); animate only genuinely new arrivals after.
      const seen = seenSigsRef.current;
      const freshSigs = txs.map(t => t.signature).filter(s => !seen.has(s));
      txs.forEach(t => seen.add(t.signature));
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
      } else if (freshSigs.length > 0) {
        setNewSignatures(new Set(freshSigs));
      }

      // Preserve already-inspected details (fee/CU/full response) across refreshes
      // so analytics keep their fetched values instead of resetting each interval.
      setTransactions(prev => {
        const prevMap = new Map(prev.map(t => [t.signature, t]));
        return txs.map(t => {
          const old = prevMap.get(t.signature);
          return old
            ? { ...t, details: old.details, fee: old.fee, computeUnits: old.computeUnits }
            : t;
        });
      });
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      setIsLoading(false);
    }
  }, [connection, isPaused]);

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

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Auto-refresh
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(fetchTransactions, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTransactions, isPaused]);

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
            label="Sample Size"
            value={stats.total.toString()}
            hint={`${MAX_TRANSACTIONS} max`}
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
                  transactions={filteredTransactions}
                  lastSlot={lastSlot}
                  isPaused={isPaused}
                  detailsLoading={detailsLoading}
                  selectedTxSignature={selectedTx?.signature || null}
                  refreshInterval={REFRESH_INTERVAL}
                  onPauseToggle={handlePauseToggle}
                  onInspect={handleInspect}
                  newSignatures={newSignatures}
                />
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
