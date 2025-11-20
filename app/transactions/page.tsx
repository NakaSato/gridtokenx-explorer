'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { LoadingCard } from '@/app/(shared)/components/common/LoadingCard';
import { AnchorDeveloperTools } from '@/app/(features)/transactions/components/AnchorDeveloperTools';
import { TransactionAnalytics } from '@/app/(features)/transactions/components/TransactionAnalytics';
import { ProgramMonitorCard } from '@/app/(features)/transactions/components/ProgramMonitorCard';
import {
  RealtimeTransactionTable,
  Transaction,
} from '@/app/(features)/transactions/components/RealtimeTransactionTable';
import { TransactionDetailsCard } from '@/app/(features)/transactions/components/TransactionDetailsCard';
import { MonitoringGuideCard } from '@/app/(features)/transactions/components/MonitoringGuideCard';
import { useCluster } from '@/app/(core)/providers/cluster';
import { ClusterStatus } from '@/app/(shared)/utils/cluster';
import { createSolanaRpc } from '@solana/kit';
import { toAddress, toSignature, createRpc, toLegacyParsedTransaction } from '@/app/(shared)/utils/rpc';

const MAX_TRANSACTIONS = 50;
const REFRESH_INTERVAL = 5000; // 5 seconds

export default function RealtimeTransactionsPage() {
  const { cluster, url, status } = useCluster();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const [lastSlot, setLastSlot] = React.useState<number | null>(null);
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [customProgramId, setCustomProgramId] = React.useState<string>('');
  const [connectionErrorCount, setConnectionErrorCount] = React.useState(0);
  const maxConnectionErrors = 3; // Stop retrying after 3 consecutive errors

  const fetchTransactions = React.useCallback(async () => {
    if (status !== ClusterStatus.Connected || isPaused) return;

    // Stop retrying if we've had too many consecutive connection errors
    if (connectionErrorCount >= maxConnectionErrors) {
      return;
    }

    try {
      // Use @solana/kit for modern RPC calls
      const rpc = createSolanaRpc(url);

      // Get recent slot
      const slot = await rpc.getSlot().send();
      setLastSlot(Number(slot));

      let signatures: Transaction[] = [];

      // Helper to convert kit signature to Transaction type
      const convertSignature = (sig: any): Transaction => {
        // Properly handle blockTime conversion - it comes as bigint (seconds) or null
        // Solana blockTime is in seconds, but we store as number for compatibility
        let blockTime: number | null = null;
        if (sig.blockTime !== null && sig.blockTime !== undefined) {
          blockTime =
            typeof sig.blockTime === 'bigint'
              ? Number(sig.blockTime)
              : typeof sig.blockTime === 'number'
                ? sig.blockTime
                : null;
        }

        return {
          signature: sig.signature,
          slot: typeof sig.slot === 'bigint' ? Number(sig.slot) : sig.slot,
          err: sig.err,
          memo: sig.memo || null,
          blockTime,
          confirmationStatus: sig.confirmationStatus as 'processed' | 'confirmed' | 'finalized' | undefined,
        };
      };

      // If custom program ID is provided, monitor it
      if (customProgramId) {
        try {
          const programAddress = toAddress(customProgramId);
          const kitSignatures = await rpc
            .getSignaturesForAddress(programAddress, {
              limit: MAX_TRANSACTIONS,
            })
            .send();
          signatures = kitSignatures.map(convertSignature);
        } catch (err) {
          console.error('Invalid program ID, falling back to system program');
          const systemProgramId = toAddress('11111111111111111111111111111111');
          const kitSignatures = await rpc
            .getSignaturesForAddress(systemProgramId, {
              limit: MAX_TRANSACTIONS,
            })
            .send();
          signatures = kitSignatures.map(convertSignature);
        }
      } else {
        // Get signatures from a well-known program to ensure we get recent activity
        const systemProgramId = toAddress('11111111111111111111111111111111');
        const kitSignatures = await rpc
          .getSignaturesForAddress(systemProgramId, {
            limit: MAX_TRANSACTIONS,
          })
          .send();
        signatures = kitSignatures.map(convertSignature);
      }

      setTransactions(signatures);
      setLoading(false);
      setError(null);
      setConnectionErrorCount(0); // Reset error count on success
    } catch (err) {
      const isConnectionError = err instanceof TypeError && err.message.includes('fetch');
      const isNetworkError =
        err instanceof Error && (err.message.includes('ECONNREFUSED') || err.message.includes('network'));

      // Increment error count for connection/network errors
      if (isConnectionError || isNetworkError) {
        setConnectionErrorCount(prev => prev + 1);
      }

      // Only log once to avoid console spam
      if (connectionErrorCount === 0) {
        console.error('Error fetching transactions:', err);
      }

      const errorMessage =
        isConnectionError || isNetworkError
          ? 'Cannot connect to RPC endpoint. Please check your cluster settings or ensure a local validator is running.'
          : err instanceof Error
            ? err.message
            : 'Failed to fetch transactions';
      setError(errorMessage);
      setLoading(false);
    }
  }, [url, status, isPaused, customProgramId, connectionErrorCount, maxConnectionErrors]);

  const fetchTransactionDetails = React.useCallback(
    async (tx: Transaction) => {
      if (tx.details) {
        setSelectedTx(tx);
        return;
      }

      setDetailsLoading(true);
      try {
        // Use @solana/kit for modern RPC calls
        const rpc = createRpc(url);
        const kitTransaction = await rpc
          .getTransaction(toSignature(tx.signature), {
            commitment: 'confirmed',
            encoding: 'jsonParsed',
            maxSupportedTransactionVersion: 0,
          })
          .send();

        if (!kitTransaction) {
          console.error('Transaction not found:', tx.signature);
          setDetailsLoading(false);
          return;
        }

        // Convert kit response to legacy format for compatibility
        const details = toLegacyParsedTransaction(kitTransaction);

        if (details) {
          // Extract program IDs from instructions
          const programIds: string[] = [];
          const accountKeys: string[] = [];

          // Handle both legacy and versioned transaction formats
          const instructions = details.transaction?.message?.instructions || [];
          instructions.forEach((ix: any) => {
            if (ix.programId) {
              const programIdStr = typeof ix.programId === 'string' ? ix.programId : ix.programId.toBase58();
              if (!programIds.includes(programIdStr)) {
                programIds.push(programIdStr);
              }
            }
          });

          // Extract account keys
          if (details.transaction?.message?.accountKeys) {
            const keys = details.transaction.message.accountKeys;
            keys.forEach((key: any) => {
              const keyStr = typeof key === 'string' ? key : key.pubkey?.toBase58() || key.toBase58();
              accountKeys.push(keyStr);
            });
          }

          // Extract compute units and fee from meta
          const computeUnits = details.meta?.computeUnitsConsumed;
          const fee = details.meta?.fee;

          const enhancedTx: Transaction = {
            ...tx,
            accountKeys,
            computeUnits,
            details,
            fee,
            programIds,
          };

          // Update the transaction in the list
          setTransactions(prev => prev.map(t => (t.signature === tx.signature ? enhancedTx : t)));
          setSelectedTx(enhancedTx);
        }
      } catch (err) {
        console.error('Error fetching transaction details:', err);
      } finally {
        setDetailsLoading(false);
      }
    },
    [url],
  );

  React.useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  if (status === ClusterStatus.Connecting) {
    return (
      <div className="container mt-4">
        <LoadingCard message="Connecting to cluster..." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <LoadingCard message="Loading real-time transactions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <ErrorCard
          text={error}
          retry={() => {
            setConnectionErrorCount(0);
            setError(null);
            setLoading(true);
            fetchTransactions();
          }}
        />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      }
    >
      <div className="container mx-auto space-y-6 px-4 py-8">
        {/* Program ID Filter */}
        <ProgramMonitorCard
          customProgramId={customProgramId}
          onProgramIdChange={setCustomProgramId}
          onMonitor={() => {
            setLoading(true);
            fetchTransactions();
          }}
        />

        {/* Transaction Analytics */}
        <TransactionAnalytics transactions={transactions} />

        {/* Anchor Developer Tools - Show when program ID is entered */}
        {customProgramId && <AnchorDeveloperTools programId={customProgramId} clusterUrl={url} />}

        {/* Real-time Transactions Table */}
        <RealtimeTransactionTable
          transactions={transactions}
          lastSlot={lastSlot}
          isPaused={isPaused}
          detailsLoading={detailsLoading}
          selectedTxSignature={selectedTx?.signature || null}
          refreshInterval={REFRESH_INTERVAL}
          onPauseToggle={() => setIsPaused(!isPaused)}
          onInspect={fetchTransactionDetails}
        />

        {/* Transaction Details Modal */}
        {selectedTx && <TransactionDetailsCard tx={selectedTx} onClose={() => setSelectedTx(null)} />}

        {/* Monitoring Guide */}
        <MonitoringGuideCard />
      </div>
    </Suspense>
  );
}
