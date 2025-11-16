'use client';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { TimestampToggle } from '@components/common/TimestampToggle';
import { AnchorDeveloperTools } from '@components/transaction/AnchorDeveloperTools';
import { AnchorEventDecoder } from '@components/transaction/AnchorEventDecoder';
import { LocalhostDeveloperGuide } from '@components/transaction/LocalhostDeveloperGuide';
import { TransactionAnalytics } from '@components/transaction/TransactionAnalytics';
import { useCluster } from '@providers/cluster';
import { ClusterStatus } from '@utils/cluster';
import {
    ConfirmedSignatureInfo,
    Connection,
    ParsedTransactionWithMeta,
    PublicKey,
    TransactionResponse,
    VersionedTransactionResponse,
} from '@solana/web3.js';
import React from 'react';

const MAX_TRANSACTIONS = 50;
const REFRESH_INTERVAL = 5000; // 5 seconds

interface EnhancedTransaction extends ConfirmedSignatureInfo {
    details?: VersionedTransactionResponse | null;
    programIds?: string[];
    accountKeys?: string[];
    computeUnits?: number;
    fee?: number;
}

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
            const connection = new Connection(url);

            // Get recent slot
            const slot = await connection.getSlot();
            setLastSlot(slot);

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
        <div className="container mt-4">
            {/* Localhost Developer Guide - Shows for localhost/custom cluster */}
            <LocalhostDeveloperGuide isLocalhost={url.includes('localhost') || url.includes('127.0.0.1')} />

            {/* Program ID Filter */}
            <div className="bg-card mb-4 rounded-lg border shadow-sm">
                <div className="p-6">
                    <h5 className="mb-3 text-lg font-semibold">Monitor Your P2P Energy Trading Platform</h5>
                    <p className="text-muted-foreground mb-3">
                        Enter your Anchor program ID to monitor transactions specific to your energy trading platform
                    </p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <div className="md:col-span-9">
                            <input
                                type="text"
                                className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring focus:border-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
                                placeholder="Enter your program ID (e.g., YourProgramId...)"
                                value={customProgramId}
                                onChange={e => setCustomProgramId(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <button
                                className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring w-full rounded-md px-4 py-2 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                                onClick={() => {
                                    setLoading(true);
                                    fetchTransactions();
                                }}
                            >
                                Monitor Program
                            </button>
                        </div>
                    </div>
                    {customProgramId && (
                        <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                            <strong>Monitoring:</strong> {customProgramId}
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Analytics */}
            <TransactionAnalytics transactions={transactions} />

            {/* Anchor Developer Tools - Show when program ID is entered */}
            {customProgramId && <AnchorDeveloperTools programId={customProgramId} clusterUrl={url} />}

            <div className="bg-card rounded-lg border shadow-sm">
                <div className="border-b px-6 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold">Real-time Transactions</h4>
                        </div>
                        <div className="flex items-center gap-3">
                            {lastSlot && (
                                <span className="text-muted-foreground text-sm">
                                    Current Slot: <Slot slot={lastSlot} link />
                                </span>
                            )}
                            {!isPaused && (
                                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                    <span
                                        className="mr-2 h-3 w-3 animate-spin rounded-full border border-green-600 border-t-transparent"
                                        role="status"
                                    />
                                    Live
                                </span>
                            )}
                            <button
                                className={`rounded-md px-3 py-1 text-sm ${isPaused ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}
                                onClick={() => setIsPaused(!isPaused)}
                            >
                                {isPaused ? '▶ Resume' : '⏸ Pause'}
                            </button>
                        </div>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Showing the latest {transactions.length} transactions. Updates every {REFRESH_INTERVAL / 1000}{' '}
                        seconds when not paused.
                    </p>
                </div>
                <div className="mb-0 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th className="text-muted-foreground">Signature</th>
                                <th className="text-muted-foreground">Slot</th>
                                <th className="text-muted-foreground">Time</th>
                                <th className="text-muted-foreground">Status</th>
                                <th className="text-muted-foreground">Confirmations</th>
                                <th className="text-muted-foreground">Details</th>
                            </tr>
                        </thead>
                        <tbody className="list">
                            {transactions.map((tx, index) => (
                                <tr key={`${tx.signature}-${index}`}>
                                    <td>
                                        <Signature signature={tx.signature} link truncateChars={48} />
                                    </td>
                                    <td>
                                        <Slot slot={tx.slot} link />
                                    </td>
                                    <td>
                                        {tx.blockTime ? (
                                            <TimestampToggle unixTimestamp={tx.blockTime} shorter />
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td>
                                        {tx.err ? (
                                            <span className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">
                                                Failed
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
                                                Success
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {tx.confirmationStatus === 'finalized' ? (
                                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                                                Finalized
                                            </span>
                                        ) : tx.confirmationStatus === 'confirmed' ? (
                                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                                                Confirmed
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                                                Processed
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm"
                                            onClick={() => fetchTransactionDetails(tx)}
                                            disabled={detailsLoading}
                                        >
                                            {detailsLoading && selectedTx?.signature === tx.signature ? (
                                                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            ) : null}
                                            Inspect
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transaction Details Modal */}
            {selectedTx && <TransactionDetailsCard tx={selectedTx} onClose={() => setSelectedTx(null)} />}

            <div className="bg-card mt-4 rounded-lg border shadow-sm">
                <div className="p-6">
                    <h5 className="text-lg font-semibold">P2P Energy Trading Platform Monitoring</h5>
                    <p className="text-muted-foreground mb-2">
                        This page is designed to help you monitor your Anchor-based P2P energy trading platform on
                        Solana. You can view real-time transactions and inspect deep details including:
                    </p>
                    <ul className="text-muted-foreground mb-0">
                        <li>
                            <strong>Program Instructions:</strong> See all program invocations in each transaction
                        </li>
                        <li>
                            <strong>Account Changes:</strong> Monitor which accounts were read/written
                        </li>
                        <li>
                            <strong>Compute Units:</strong> Track computational resources used
                        </li>
                        <li>
                            <strong>Transaction Fees:</strong> View the cost of each transaction in lamports
                        </li>
                        <li>
                            <strong>Anchor Program Data:</strong> Deep inspection of your custom program interactions
                        </li>
                        <li>
                            <strong>Energy Trading Events:</strong> Monitor trades, settlements, and platform activity
                        </li>
                    </ul>
                    <div className="mt-3 mb-0 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
                        <strong>Pro Tip:</strong> Enter your program ID above to filter transactions specific to your
                        energy trading platform. Click "Inspect" on any transaction to see full details including all
                        accounts, instructions, and program logs.
                    </div>
                </div>
            </div>
        </div>
    );
}

// Transaction Details Component
function TransactionDetailsCard({ tx, onClose }: { tx: EnhancedTransaction; onClose: () => void }) {
    if (!tx.details) {
        return null;
    }

    const details = tx.details;
    const message = details.transaction.message;
    const accountKeys = message.getAccountKeys().staticAccountKeys;
    const instructions = message.compiledInstructions;

    return (
        <div className="bg-card mt-4 rounded-lg border shadow-sm">
            <div className="border-b px-6 py-4">
                <div className="flex items-center">
                    <div className="flex-1">
                        <h4 className="text-lg font-semibold">Transaction Deep Inspection</h4>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            className="rounded-md border bg-white px-3 py-1.5 text-sm text-black hover:bg-gray-100"
                            onClick={onClose}
                        >
                            ✕ Close
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-6">
                {/* Transaction Overview */}
                <div className="mb-4">
                    <h5 className="border-bottom pb-2">Overview</h5>
                    <div className="row">
                        <div className="col-md-6">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="w-50">
                                            <strong>Signature:</strong>
                                        </td>
                                        <td>
                                            <Signature signature={tx.signature} link truncateChars={20} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Slot:</strong>
                                        </td>
                                        <td>
                                            <Slot slot={tx.slot} link />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Fee (lamports):</strong>
                                        </td>
                                        <td>{tx.fee?.toLocaleString() || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="col-md-6">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr>
                                        <td className="w-50">
                                            <strong>Compute Units:</strong>
                                        </td>
                                        <td>{tx.computeUnits?.toLocaleString() || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Instructions:</strong>
                                        </td>
                                        <td>{instructions.length}</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <strong>Accounts:</strong>
                                        </td>
                                        <td>{accountKeys.length}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Programs Invoked */}
                <div className="mb-4">
                    <h5 className="border-bottom pb-2">Programs Invoked</h5>
                    {tx.programIds && tx.programIds.length > 0 ? (
                        <div className="list-group">
                            {tx.programIds.map((programId, idx) => (
                                <div key={idx} className="list-group-item">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <strong>Program {idx + 1}:</strong>
                                            <Address pubkey={new PublicKey(programId)} link />
                                        </div>
                                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                                            {getProgramName(programId)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No program IDs found</p>
                    )}
                </div>

                {/* Instructions */}
                <div className="mb-4">
                    <h5 className="border-bottom pb-2">Instructions ({instructions.length})</h5>
                    <div className="accordion" id="instructionsAccordion">
                        {instructions.map((instruction, idx) => {
                            const programId = accountKeys[instruction.programIdIndex];
                            return (
                                <div key={idx} className="accordion-item">
                                    <h2 className="accordion-header">
                                        <button
                                            className="accordion-button collapsed"
                                            type="button"
                                            data-bs-toggle="collapse"
                                            data-bs-target={`#instruction-${idx}`}
                                        >
                                            <strong>Instruction #{idx + 1}:</strong>
                                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                                {getProgramName(programId.toBase58())}
                                            </span>
                                        </button>
                                    </h2>
                                    <div
                                        id={`instruction-${idx}`}
                                        className="accordion-collapse collapse"
                                        data-bs-parent="#instructionsAccordion"
                                    >
                                        <div className="accordion-body">
                                            <div className="mb-2">
                                                <strong>Program:</strong>
                                                <Address pubkey={programId} link />
                                            </div>
                                            <div className="mb-2">
                                                <strong>Accounts ({instruction.accountKeyIndexes.length}):</strong>
                                                <ul className="list-group mt-2">
                                                    {instruction.accountKeyIndexes.map((accountIdx, i) => (
                                                        <li key={i} className="list-group-item">
                                                            <span className="mr-2 inline-flex items-center rounded-full bg-gray-500 px-2 py-0.5 text-xs font-medium text-white">
                                                                #{i}
                                                            </span>
                                                            <Address pubkey={accountKeys[accountIdx]} link />
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <strong>Data:</strong>
                                                <pre className="bg-light small mt-2 p-2">
                                                    {Buffer.from(instruction.data).toString('hex')}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Account Keys */}
                <div className="mb-4">
                    <h5 className="border-bottom pb-2">All Accounts ({accountKeys.length})</h5>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Address</th>
                                    <th>Writable</th>
                                    <th>Signer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accountKeys.map((account, idx) => {
                                    const isWritable =
                                        details.meta?.preBalances[idx] !== details.meta?.postBalances[idx];
                                    const isSigner = message.isAccountSigner(idx);
                                    return (
                                        <tr key={idx}>
                                            <td>{idx}</td>
                                            <td>
                                                <Address pubkey={account} link />
                                            </td>
                                            <td>
                                                {isWritable ? (
                                                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-800">
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {isSigner ? (
                                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-800">
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Program Logs */}
                {details.meta?.logMessages && details.meta.logMessages.length > 0 && (
                    <>
                        {/* Decoded Anchor Events */}
                        <AnchorEventDecoder logs={details.meta.logMessages} programId={tx.programIds?.[0]} />

                        <div className="mb-4">
                            <h5 className="border-bottom pb-2">Program Logs (Raw)</h5>
                            <pre className="bg-dark text-light p-3" style={{ maxHeight: '400px', overflow: 'auto' }}>
                                {details.meta.logMessages.map((log, idx) => (
                                    <div key={idx}>{log}</div>
                                ))}
                            </pre>
                        </div>
                    </>
                )}

                {/* Balance Changes */}
                {details.meta?.preBalances && details.meta?.postBalances && (
                    <div>
                        <h5 className="border-bottom pb-2">Balance Changes</h5>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr>
                                        <th>Account</th>
                                        <th>Pre Balance</th>
                                        <th>Post Balance</th>
                                        <th>Change</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accountKeys.map((account, idx) => {
                                        const pre = details.meta?.preBalances[idx] || 0;
                                        const post = details.meta?.postBalances[idx] || 0;
                                        const change = post - pre;
                                        if (change === 0) return null;
                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <Address pubkey={account} link truncate />
                                                </td>
                                                <td>{(pre / 1e9).toFixed(9)} SOL</td>
                                                <td>{(post / 1e9).toFixed(9)} SOL</td>
                                                <td>
                                                    <span className={change > 0 ? 'text-success' : 'text-danger'}>
                                                        {change > 0 ? '+' : ''}
                                                        {(change / 1e9).toFixed(9)} SOL
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function to identify common programs
function getProgramName(programId: string): string {
    const knownPrograms: Record<string, string> = {
        '11111111111111111111111111111111': 'System Program',
        TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: 'Token Program',
        TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb: 'Token-2022',
        ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL: 'Associated Token',
        ComputeBudget111111111111111111111111111111: 'Compute Budget',
        Vote111111111111111111111111111111111111111: 'Vote Program',
        Stake11111111111111111111111111111111111111: 'Stake Program',
    };
    return knownPrograms[programId] || 'Custom Program';
}
