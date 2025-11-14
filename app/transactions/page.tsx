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
                                ix => ix.programIdIndex === idx
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
        [url]
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
            <div className="card mb-4">
                <div className="card-body">
                    <h5 className="card-title">Monitor Your P2P Energy Trading Platform</h5>
                    <p className="text-muted mb-3">
                        Enter your Anchor program ID to monitor transactions specific to your energy trading platform
                    </p>
                    <div className="row">
                        <div className="col-md-9">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter your program ID (e.g., YourProgramId...)"
                                value={customProgramId}
                                onChange={e => setCustomProgramId(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <button
                                className="btn btn-primary w-100"
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
                        <div className="alert alert-success mt-3 mb-0">
                            <strong>Monitoring:</strong> {customProgramId}
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Analytics */}
            <TransactionAnalytics transactions={transactions} />

            {/* Anchor Developer Tools - Show when program ID is entered */}
            {customProgramId && <AnchorDeveloperTools programId={customProgramId} clusterUrl={url} />}

            <div className="card">
                <div className="card-header">
                    <div className="row align-items-center">
                        <div className="col">
                            <h4 className="card-header-title">Real-time Transactions</h4>
                        </div>
                        <div className="col-auto">
                            <div className="d-flex align-items-center gap-3">
                                {lastSlot && (
                                    <span className="text-muted small">
                                        Current Slot: <Slot slot={lastSlot} link />
                                    </span>
                                )}
                                {!isPaused && (
                                    <span className="badge bg-success-soft">
                                        <span className="spinner-grow spinner-grow-sm m2" role="status" />
                                        Live
                                    </span>
                                )}
                                <button
                                    className={`btn btn-sm ${isPaused ? 'btn-success' : 'btn-warning'}`}
                                    onClick={() => setIsPaused(!isPaused)}
                                >
                                    {isPaused ? '▶ Resume' : '⏸ Pause'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="text-muted mb-0 mt-2">
                        Showing the latest {transactions.length} transactions. Updates every {REFRESH_INTERVAL / 1000}{' '}
                        seconds when not paused.
                    </p>
                </div>
                <div className="tablresponsive mb-0">
                    <table className="table tablsm tablnowrap card-table">
                        <thead>
                            <tr>
                                <th className="text-muted">Signature</th>
                                <th className="text-muted">Slot</th>
                                <th className="text-muted">Time</th>
                                <th className="text-muted">Status</th>
                                <th className="text-muted">Confirmations</th>
                                <th className="text-muted">Details</th>
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
                                            <span className="text-muted">-</span>
                                        )}
                                    </td>
                                    <td>
                                        {tx.err ? (
                                            <span className="badge bg-danger-soft">Failed</span>
                                        ) : (
                                            <span className="badge bg-success-soft">Success</span>
                                        )}
                                    </td>
                                    <td>
                                        {tx.confirmationStatus === 'finalized' ? (
                                            <span className="badge bg-success">Finalized</span>
                                        ) : tx.confirmationStatus === 'confirmed' ? (
                                            <span className="badge bg-info">Confirmed</span>
                                        ) : (
                                            <span className="badge bg-warning">Processed</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => fetchTransactionDetails(tx)}
                                            disabled={detailsLoading}
                                        >
                                            {detailsLoading && selectedTx?.signature === tx.signature ? (
                                                <span className="spinner-border spinner-border-sm m2" />
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

            <div className="card mt-4">
                <div className="card-body">
                    <h5 className="card-title">P2P Energy Trading Platform Monitoring</h5>
                    <p className="text-muted mb-2">
                        This page is designed to help you monitor your Anchor-based P2P energy trading platform on
                        Solana. You can view real-time transactions and inspect deep details including:
                    </p>
                    <ul className="text-muted mb-0">
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
                    <div className="alert alert-info mt-3 mb-0">
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
        <div className="card mt-4">
            <div className="card-header">
                <div className="row align-items-center">
                    <div className="col">
                        <h4 className="card-header-title">Transaction Deep Inspection</h4>
                    </div>
                    <div className="col-auto">
                        <button className="btn btn-sm btn-white" onClick={onClose}>
                            ✕ Close
                        </button>
                    </div>
                </div>
            </div>
            <div className="card-body">
                {/* Transaction Overview */}
                <div className="mb-4">
                    <h5 className="border-bottom pb-2">Overview</h5>
                    <div className="row">
                        <div className="col-md-6">
                            <table className="table tablsm">
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
                            <table className="table tablsm">
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
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>Program {idx + 1}:</strong>
                                            <Address pubkey={new PublicKey(programId)} link />
                                        </div>
                                        <span className="badge bg-primary">{getProgramName(programId)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">No program IDs found</p>
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
                                            <span className="ms-2 badge bg-info">
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
                                                            <span className="badge bg-secondary m2">#{i}</span>
                                                            <Address pubkey={accountKeys[accountIdx]} link />
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <strong>Data:</strong>
                                                <pre className="bg-light p-2 mt-2 small">
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
                    <div className="tablresponsive">
                        <table className="table tablsm">
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
                                                    <span className="badge bg-warning">Yes</span>
                                                ) : (
                                                    <span className="badge bg-secondary">No</span>
                                                )}
                                            </td>
                                            <td>
                                                {isSigner ? (
                                                    <span className="badge bg-success">Yes</span>
                                                ) : (
                                                    <span className="badge bg-secondary">No</span>
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
                        <div className="tablresponsive">
                            <table className="table tablsm">
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
