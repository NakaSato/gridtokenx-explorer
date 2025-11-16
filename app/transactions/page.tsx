'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense } from 'react';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { AnchorDeveloperTools } from '@components/transaction/AnchorDeveloperTools';
import { TransactionAnalytics } from '@components/transaction/TransactionAnalytics';
import { ProgramMonitorCard } from '@components/transaction/ProgramMonitorCard';
import { RealtimeTransactionTable, EnhancedTransaction } from '@components/transaction/RealtimeTransactionTable';
import { TransactionDetailsCard } from '@components/transaction/TransactionDetailsCard';
import { MonitoringGuideCard } from '@components/transaction/MonitoringGuideCard';
import { useCluster } from '@providers/cluster';
import { ClusterStatus } from '@utils/cluster';
import { createSolanaRpc, address } from '@solana/kit';
import { ConfirmedSignatureInfo, Connection, PublicKey } from '@solana/web3.js';

const MAX_TRANSACTIONS = 50;
const REFRESH_INTERVAL = 5000; // 5 seconds

export default function RealtimeTransactionsPage() {
    const { cluster, url, status } = useCluster();
    const [transactions, setTransactions] = React.useState<EnhancedTransaction[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isPaused, setIsPaused] = React.useState(false);
    const [lastSlot, setLastSlot] = React.useState<number | null>(null);
    const [selectedTx, setSelectedTx] = React.useState<EnhancedTransaction | null>(null);
    const [detailsLoading, setDetailsLoading] = React.useState(false);
    const [customProgramId, setCustomProgramId] = React.useState<string>('');

    const fetchTransactions = React.useCallback(async () => {
        if (status !== ClusterStatus.Connected || isPaused) return;

        try {
            // Use @solana/kit for modern RPC calls
            const rpc = createSolanaRpc(url);

            // Get recent slot
            const slot = await rpc.getSlot().send();
            setLastSlot(Number(slot));

            // For getSignaturesForAddress, we still need to use Connection for now
            // until we update the type handling throughout the app
            const connection = new Connection(url);
            let signatures: ConfirmedSignatureInfo[] = [];

            // If custom program ID is provided, monitor it
            if (customProgramId) {
                try {
                    const programPubkey = new PublicKey(customProgramId);
                    signatures = await connection.getSignaturesForAddress(programPubkey, {
                        limit: MAX_TRANSACTIONS,
                    });
                } catch (err) {
                    console.error('Invalid program ID, falling back to system program');
                    const systemProgramId = new PublicKey('11111111111111111111111111111111');
                    signatures = await connection.getSignaturesForAddress(systemProgramId, {
                        limit: MAX_TRANSACTIONS,
                    });
                }
            } else {
                // Get signatures from a well-known program to ensure we get recent activity
                const systemProgramId = new PublicKey('11111111111111111111111111111111');
                signatures = await connection.getSignaturesForAddress(systemProgramId, {
                    limit: MAX_TRANSACTIONS,
                });
            }

            setTransactions(signatures as EnhancedTransaction[]);
            setLoading(false);
            setError(null);
        } catch (err) {
            console.error('Error fetching transactions:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
            setLoading(false);
        }
    }, [url, status, isPaused, customProgramId]);

    const fetchTransactionDetails = React.useCallback(
        async (tx: EnhancedTransaction) => {
            if (tx.details) {
                setSelectedTx(tx);
                return;
            }

            setDetailsLoading(true);
            try {
                const connection = new Connection(url);
                const details = await connection.getTransaction(tx.signature, {
                    maxSupportedTransactionVersion: 0,
                });

                if (details) {
                    const programIds = details.transaction.message
                        .getAccountKeys()
                        .staticAccountKeys.filter((_, idx) => {
                            return details.transaction.message.compiledInstructions.some(
                                ix => ix.programIdIndex === idx,
                            );
                        })
                        .map(key => key.toBase58());

                    const accountKeys = details.transaction.message
                        .getAccountKeys()
                        .staticAccountKeys.map(key => key.toBase58());

                    // Extract compute units from meta
                    const computeUnits = details.meta?.computeUnitsConsumed;
                    const fee = details.meta?.fee;

                    const enhancedTx: EnhancedTransaction = {
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
                <ErrorCard text={error} retry={fetchTransactions} />
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
            <div className="container mx-auto px-4 py-8 space-y-6">
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
