'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useCluster } from '@/app/(core)/providers/cluster';
import { RealtimeTransactionTable, Transaction } from '@/app/(features)/transactions/components/RealtimeTransactionTable';
import { TransactionAnalytics } from '@/app/(features)/transactions/components/TransactionAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Alert, AlertDescription } from '@/app/(shared)/components/ui/alert';
import { TransactionDetailsCard } from '@/app/(features)/transactions/components/TransactionDetailsCard';
import { ConfirmedSignatureInfo, Connection, ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';

const REFRESH_INTERVAL = 5000; // 5 seconds
const MAX_TRANSACTIONS = 25;

export default function TransactionsPage() {
  const { url } = useCluster();
  const connection = React.useMemo(() => new Connection(url), [url]);
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

      // Get recent signatures
      const address = connection.rpcEndpoint.includes('mainnet')
        ? 'Vote111111111111111111111111111111111111111' // Vote program on mainnet
        : '11111111111111111111111111111111'; // System program fallback

      const signatures = await connection.getSignaturesForAddress(
        new PublicKey(address),
        { limit: MAX_TRANSACTIONS }
      );

      // Transform signatures to Transaction format
      const txs: Transaction[] = signatures.map((sig: ConfirmedSignatureInfo) => ({
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
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Live Transactions</h1>
        <p className="text-muted-foreground">
          Real-time view of the latest transactions on the Solana blockchain
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading transactions...</p>
          </CardContent>
        </Card>
      )}

      {/* Transaction Table */}
      {!isLoading && transactions.length > 0 && (
        <>
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

          {/* Transaction Analytics */}
          <TransactionAnalytics transactions={transactions} />

          {/* Transaction Details */}
          {selectedTx && selectedTx.details && (
            <TransactionDetailsCard
              tx={selectedTx}
              onClose={() => setSelectedTx(null)}
            />
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && transactions.length === 0 && !error && (
        <Card>
          <CardHeader>
            <CardTitle>No Transactions Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No recent transactions available. This could be due to network conditions or RPC limitations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
