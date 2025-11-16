'use client';

import { Address } from '@components/common/Address';
import { Signature } from '@components/common/Signature';
import { Slot } from '@components/common/Slot';
import { Badge } from '@components/shared/ui/badge';
import { Button } from '@components/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/shared/ui/table';
import { AnchorEventDecoder } from '@components/transaction/AnchorEventDecoder';
import { PublicKey } from '@solana/web3.js';
import { addressToPublicKey, toAddress } from '@utils/rpc';
import React from 'react';
import { EnhancedTransaction } from './RealtimeTransactionTable';

interface TransactionDetailsCardProps {
    tx: EnhancedTransaction;
    onClose: () => void;
}

export function TransactionDetailsCard({ tx, onClose }: TransactionDetailsCardProps) {
    if (!tx.details) {
        return null;
    }

    const details = tx.details;
    const message = details.transaction.message;
    const accountKeys = message.getAccountKeys().staticAccountKeys;
    const instructions = message.compiledInstructions;

    return (
        <Card className="border-2">
            <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">Transaction Deep Inspection</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-background">
                        ✕ Close
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Transaction Overview */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 pb-3 border-b-2">Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground font-medium">Signature:</span>
                                <Signature signature={tx.signature} link truncateChars={20} />
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground font-medium">Slot:</span>
                                <Slot slot={tx.slot} link />
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground font-medium">Fee (lamports):</span>
                                <span className="font-mono font-semibold">{tx.fee?.toLocaleString() || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground font-medium">Compute Units:</span>
                                <span className="font-mono font-semibold">
                                    {tx.computeUnits?.toLocaleString() || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground font-medium">Instructions:</span>
                                <span className="font-mono font-semibold">{instructions.length}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground font-medium">Accounts:</span>
                                <span className="font-mono font-semibold">{accountKeys.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Programs Invoked */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 pb-3 border-b-2">Programs Invoked</h3>
                    {tx.programIds && tx.programIds.length > 0 ? (
                        <div className="space-y-3">
                            {tx.programIds.map((programId, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-4 rounded-lg border-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Badge variant="outline" className="font-semibold shrink-0">
                                            #{idx + 1}
                                        </Badge>
                                        <div className="min-w-0 flex-1">
                                            <Address pubkey={addressToPublicKey(toAddress(programId))} link />
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="ml-3 font-medium">
                                        {getProgramName(programId)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">No program IDs found</p>
                    )}
                </div>

                {/* Instructions */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 pb-3 border-b-2">
                        Instructions ({instructions.length})
                    </h3>
                    <div className="space-y-4">
                        {instructions.map((instruction, idx) => {
                            const programId = accountKeys[instruction.programIdIndex];
                            return (
                                <div
                                    key={idx}
                                    className="border-2 rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                                >
                                    <div className="p-4 bg-muted/50 border-b">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="default" className="font-semibold">
                                                #{idx + 1}
                                            </Badge>
                                            <span className="font-semibold text-foreground">Instruction</span>
                                            <Badge variant="secondary" className="font-medium">
                                                {getProgramName(programId.toBase58())}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-start gap-2">
                                            <span className="font-semibold text-muted-foreground shrink-0">
                                                Program:
                                            </span>
                                            <Address pubkey={programId} link />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-muted-foreground mb-3">
                                                Accounts ({instruction.accountKeyIndexes.length}):
                                            </div>
                                            <div className="space-y-2">
                                                {instruction.accountKeyIndexes.map((accountIdx, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                                    >
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-muted text-foreground font-mono font-semibold shrink-0"
                                                        >
                                                            #{i}
                                                        </Badge>
                                                        <div className="flex-1 min-w-0">
                                                            <Address pubkey={accountKeys[accountIdx]} link />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-muted-foreground mb-2">
                                                Instruction Data:
                                            </div>
                                            <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto border">
                                                {Buffer.from(instruction.data).toString('hex')}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Account Keys */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 pb-3 border-b-2">All Accounts ({accountKeys.length})</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Writable</TableHead>
                                <TableHead>Signer</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accountKeys.map((account, idx) => {
                                const isWritable =
                                    details.meta?.preBalances[idx] !== details.meta?.postBalances[idx];
                                const isSigner = message.isAccountSigner(idx);
                                return (
                                    <TableRow key={idx}>
                                        <TableCell>{idx}</TableCell>
                                        <TableCell>
                                            <Address pubkey={account} link />
                                        </TableCell>
                                        <TableCell>
                                            {isWritable ? (
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                    Yes
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">No</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isSigner ? (
                                                <Badge
                                                    variant="default"
                                                    className="bg-green-100 text-green-800 hover:bg-green-100"
                                                >
                                                    Yes
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">No</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {/* Program Logs */}
                {details.meta?.logMessages && details.meta.logMessages.length > 0 && (
                    <>
                        {/* Decoded Anchor Events */}
                        <AnchorEventDecoder logs={details.meta.logMessages} programId={tx.programIds?.[0]} />

                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4 pb-3 border-b-2">Program Logs (Raw)</h3>
                            <pre
                                className="bg-black text-white p-4 rounded-lg overflow-auto font-mono text-sm"
                                style={{ maxHeight: '400px' }}
                            >
                                {details.meta.logMessages.map((log, idx) => (
                                    <div key={idx}>{log}</div>
                                ))}
                            </pre>
                        </div>
                    </>
                )}

                {/* Balance Changes */}
                {details.meta?.preBalances && details.meta?.postBalances && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 pb-3 border-b-2">Balance Changes</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account</TableHead>
                                    <TableHead className="text-right">Pre Balance</TableHead>
                                    <TableHead className="text-right">Post Balance</TableHead>
                                    <TableHead className="text-right">Change</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accountKeys.map((account, idx) => {
                                    const pre = details.meta?.preBalances[idx] || 0;
                                    const post = details.meta?.postBalances[idx] || 0;
                                    const change = post - pre;
                                    if (change === 0) return null;
                                    return (
                                        <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                                            <TableCell>
                                                <Address pubkey={account} link truncate />
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {(pre / 1e9).toFixed(9)} SOL
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {(post / 1e9).toFixed(9)} SOL
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span
                                                    className={`font-mono font-semibold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}
                                                >
                                                    {change > 0 ? '+' : ''}
                                                    {(change / 1e9).toFixed(9)} SOL
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
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
