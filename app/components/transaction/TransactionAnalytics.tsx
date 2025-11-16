'use client';

import { VersionedTransactionResponse } from '@solana/web3.js';
import React from 'react';

interface TransactionAnalyticsProps {
    transactions: Array<{
        signature: string;
        blockTime?: number | null;
        err: any;
        details?: VersionedTransactionResponse | null;
        computeUnits?: number;
        fee?: number;
    }>;
}

export function TransactionAnalytics({ transactions }: TransactionAnalyticsProps) {
    // Calculate statistics
    const stats = React.useMemo(() => {
        const successCount = transactions.filter(tx => !tx.err).length;
        const failureCount = transactions.filter(tx => tx.err).length;
        const totalFees = transactions.reduce((sum, tx) => sum + (tx.fee || 0), 0);
        const avgFee = transactions.length > 0 ? totalFees / transactions.length : 0;
        const totalComputeUnits = transactions.reduce((sum, tx) => sum + (tx.computeUnits || 0), 0);
        const avgComputeUnits = transactions.length > 0 ? totalComputeUnits / transactions.length : 0;

        // Calculate TPS (transactions per second) over the time range
        const timestamps = transactions.map(tx => tx.blockTime).filter(t => t !== null) as number[];
        let tps = 0;
        if (timestamps.length > 1) {
            const minTime = Math.min(...timestamps);
            const maxTime = Math.max(...timestamps);
            const timeRange = maxTime - minTime;
            if (timeRange > 0) {
                tps = transactions.length / timeRange;
            }
        }

        return {
            avgComputeUnits,
            avgFee,
            failureCount,
            successCount,
            total: transactions.length,
            totalComputeUnits,
            totalFees,
            tps,
        };
    }, [transactions]);

    return (
        <div className="bg-card border rounded-lg shadow-sm mb-4">
            <div className="px-6 py-4 border-b">
                <h4 className="text-lg font-semibold">Transaction Analytics</h4>
            </div>
            <div className="p-6">
                <div className="row">
                    <div className="col-md-3">
                        <div className="text-center mb-3">
                            <h6 className="text-muted mb-1">Total Transactions</h6>
                            <h2 className="mb-0">{stats.total}</h2>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="text-center mb-3">
                            <h6 className="text-muted mb-1">Success Rate</h6>
                            <h2 className="mb-0 text-success">
                                {stats.total > 0 ? ((stats.successCount / stats.total) * 100).toFixed(1) : 0}%
                            </h2>
                            <small className="text-muted-foreground">
                                {stats.successCount} / {stats.total}
                            </small>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="text-center mb-3">
                            <h6 className="text-muted mb-1">Avg Fee</h6>
                            <h2 className="mb-0">{Math.round(stats.avgFee).toLocaleString()}</h2>
                            <small className="text-muted-foreground">lamports</small>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="text-center mb-3">
                            <h6 className="text-muted mb-1">Avg Compute Units</h6>
                            <h2 className="mb-0">{Math.round(stats.avgComputeUnits).toLocaleString()}</h2>
                            <small className="text-muted-foreground">CU</small>
                        </div>
                    </div>
                </div>

                <div className="row mt-3">
                    <div className="col-md-4">
                        <div className="flex justify-between align-items-center p-3 bg-success-soft rounded">
                            <div>
                                <div className="text-muted small">Successful</div>
                                <div className="h4 mb-0">{stats.successCount}</div>
                            </div>
                            <div className="text-success">
                                <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="flex justify-between align-items-center p-3 bg-danger-soft rounded">
                            <div>
                                <div className="text-muted small">Failed</div>
                                <div className="h4 mb-0">{stats.failureCount}</div>
                            </div>
                            <div className="text-danger">
                                <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="flex justify-between align-items-center p-3 bg-info-soft rounded">
                            <div>
                                <div className="text-muted small">Total Fees</div>
                                <div className="h4 mb-0">{(stats.totalFees / 1e9).toFixed(6)} SOL</div>
                            </div>
                            <div className="text-info">
                                <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73l.348.086z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {stats.tps > 0 && (
                    <div className="alert alert-info mt-4 mb-0">
                        <strong>Estimated TPS:</strong> {stats.tps.toFixed(2)} transactions per second in this sample
                    </div>
                )}
            </div>
        </div>
    );
}
