'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCluster } from '@/app/(core)/providers/cluster';
import { RealtimeTransactionTable, Transaction } from '@/app/(features)/transactions/components/RealtimeTransactionTable';
import { TransactionAnalytics } from '@/app/(features)/transactions/components/TransactionAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Alert, AlertDescription } from '@/app/(shared)/components/ui/alert';
import { TransactionDetailsCard } from '@/app/(features)/transactions/components/TransactionDetailsCard';
import { ConfirmedSignatureInfo, Connection, ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { ALL_PROGRAM_IDS } from '@/app/(features)/anchor-localnet/config';
import { Activity, Clock, Globe, Shield, Search } from 'lucide-react';
import { Badge } from '@/app/(shared)/components/ui/badge';

const REFRESH_INTERVAL = 5000; // 5 seconds
const MAX_TRANSACTIONS = 25;

export default function TransactionsPage() {
  const { cluster, url } = useCluster();
  const connection = React.useMemo(() => {
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

  // Fetch latest transactions
  const fetchTransactions = useCallback(async () => {
    if (!connection || isPaused) return;

    try {
      setError(null);
      
      // Get current slot
      const slot = await connection.getSlot();
      setLastSlot(slot);

      // On localnet/custom, we want to see GridTokenX program activity
      const isMainnet = connection.rpcEndpoint.includes('mainnet');
      const searchAddresses = isMainnet 
        ? ['Vote111111111111111111111111111111111111111'] 
        : ['11111111111111111111111111111111', ...ALL_PROGRAM_IDS];

      // Fetch from multiple addresses if needed
      const signaturePromises = searchAddresses.map(addr => 
        connection.getSignaturesForAddress(
          new PublicKey(addr),
          { limit: MAX_TRANSACTIONS }
        ).catch(e => {
          console.warn(`Failed to fetch signatures for ${addr}:`, e);
          return [] as ConfirmedSignatureInfo[];
        })
      );

      const signatureResults = await Promise.all(signaturePromises);
      
      // Flatten, deduplicate by signature, and sort by slot (desc)
      const allSignatures = signatureResults.flat();
      const uniqueSignatures = Array.from(
        new Map(allSignatures.map(sig => [sig.signature, sig])).values()
      ).sort((a, b) => b.slot - a.slot)
       .slice(0, MAX_TRANSACTIONS);

      // Transform signatures to Transaction format
      const txs: Transaction[] = uniqueSignatures.map((sig: ConfirmedSignatureInfo) => ({
        signature: sig.signature,
        slot: sig.slot,
        err: sig.err,
        memo: sig.memo || null,
        blockTime: sig.blockTime || null,
        confirmationStatus: sig.confirmationStatus,
      }));

      setTransactions(txs);
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
          // Update transaction with details
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

          // Update selected transaction
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

  // Toggle pause/resume
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

    const interval = setInterval(() => {
      fetchTransactions();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchTransactions, isPaused]);

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 selection:bg-primary/30">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[5%] w-[30%] h-[30%] rounded-full bg-white/5 blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold">
                Blockchain Activity
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4 text-white">
              <div className="rounded-2xl bg-primary p-2.5 shadow-lg shadow-primary/20 text-navy-900">
                <Activity className="h-8 w-8" />
              </div>
              Live Transactions
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl font-medium">
              Real-time view of the latest transactions and on-chain program executions for the GridTokenX network.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-navy-800/50 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-xl">
             <div className="bg-primary/20 p-2 rounded-full">
                <Clock className="h-5 w-5 text-primary" />
             </div>
             <div className="text-xs">
                <p className="text-slate-400 font-bold uppercase tracking-tighter">Current Slot</p>
                <p className="text-white font-mono font-bold text-primary">{lastSlot?.toLocaleString() || '...'}</p>
             </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8 bg-red-500/10 border-red-500/20 text-red-400">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content Area */}
        <div className="space-y-8">
          {isLoading ? (
            <Card className="border-white/5 bg-navy-800/20 backdrop-blur-sm p-12 text-center">
              <CardContent>
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
                <p className="mt-4 text-slate-400 font-medium">Loading transactions...</p>
              </CardContent>
            </Card>
          ) : transactions.length > 0 ? (
            <div className="space-y-8">
              <div className="rounded-3xl border border-white/5 bg-navy-800/20 backdrop-blur-sm overflow-hidden shadow-2xl p-8">
                <RealtimeTransactionTable
                  transactions={transactions}
                  lastSlot={lastSlot}
                  isPaused={isPaused}
                  detailsLoading={detailsLoading}
                  selectedTxSignature={selectedTx?.signature || null}
                  refreshInterval={REFRESH_INTERVAL}
                  onPauseToggle={handlePauseToggle}
                  onInspect={handleInspect}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <TransactionAnalytics transactions={transactions} />
                 {selectedTx && selectedTx.details ? (
                    <TransactionDetailsCard
                      tx={selectedTx}
                      onClose={() => setSelectedTx(null)}
                    />
                 ) : (
                    <Card className="border-white/5 bg-navy-800/20 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center border-dashed">
                       <div className="bg-white/5 p-4 rounded-full mb-4">
                          <Search className="h-8 w-8 text-slate-500" />
                       </div>
                       <h3 className="text-white font-bold">No Transaction Selected</h3>
                       <p className="text-slate-500 text-sm max-w-[240px] mt-2">Select a transaction from the table above to view detailed instructions and logs.</p>
                    </Card>
                 )}
              </div>
            </div>
          ) : (
            <Card className="border-white/5 bg-navy-800/20 backdrop-blur-sm p-12 text-center">
              <CardHeader>
                <CardTitle className="text-white">No Transactions Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 max-w-md mx-auto">
                  No recent transactions available. {url?.includes('localhost') || url?.includes('127.0.0.1') 
                    ? 'Ensure your local Solana validator is running and there is activity on the GridTokenX programs.' 
                    : 'This could be due to network conditions or RPC limitations.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
