'use client';

import { Address } from '@/app/(shared)/components/Address';
import { Signature } from '@/app/(shared)/components/Signature';
import { Slot } from '@/app/(shared)/components/Slot';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/(shared)/components/ui/table';
import { AnchorEventDecoder } from '@/app/(features)/transactions/components/AnchorEventDecoder';
import { PublicKey } from '@solana/web3.js';
import { addressToPublicKey, toAddress } from '@/app/(shared)/utils/rpc';
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
          <h3 className="mb-4 border-b-2 pb-3 text-lg font-semibold">Overview</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="bg-muted/30 space-y-3 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground font-medium">Signature:</span>
                <Signature signature={tx.signature} link truncateChars={20} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground font-medium">Slot:</span>
                <Slot slot={tx.slot} link />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground font-medium">Fee (lamports):</span>
                <span className="font-mono font-semibold">{tx.fee?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>
            <div className="bg-muted/30 space-y-3 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground font-medium">Compute Units:</span>
                <span className="font-mono font-semibold">{tx.computeUnits?.toLocaleString() || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground font-medium">Instructions:</span>
                <span className="font-mono font-semibold">{instructions.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground font-medium">Accounts:</span>
                <span className="font-mono font-semibold">{accountKeys.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Programs Invoked */}
        <div className="mb-8">
          <h3 className="mb-4 border-b-2 pb-3 text-lg font-semibold">Programs Invoked</h3>
          {tx.programIds && tx.programIds.length > 0 ? (
            <div className="space-y-3">
              {tx.programIds.map((programId, idx) => (
                <div
                  key={idx}
                  className="bg-muted/30 hover:bg-muted/50 flex items-center justify-between rounded-lg border-2 p-4 transition-colors"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Badge variant="outline" className="shrink-0 font-semibold">
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
          <h3 className="mb-4 border-b-2 pb-3 text-lg font-semibold">Instructions ({instructions.length})</h3>
          <div className="space-y-4">
            {instructions.map((instruction, idx) => {
              const programId = accountKeys[instruction.programIdIndex];
              return (
                <div
                  key={idx}
                  className="hover:border-primary/50 overflow-hidden rounded-lg border-2 transition-colors"
                >
                  <div className="bg-muted/50 border-b p-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="font-semibold">
                        #{idx + 1}
                      </Badge>
                      <span className="text-foreground font-semibold">Instruction</span>
                      <Badge variant="secondary" className="font-medium">
                        {getProgramName(programId.toBase58())}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4 p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0 font-semibold">Program:</span>
                      <Address pubkey={programId} link />
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-3 font-semibold">
                        Accounts ({instruction.accountKeyIndexes.length}):
                      </div>
                      <div className="space-y-2">
                        {instruction.accountKeyIndexes.map((accountIdx, i) => (
                          <div
                            key={i}
                            className="bg-muted/30 hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                          >
                            <Badge
                              variant="outline"
                              className="bg-muted text-foreground shrink-0 font-mono font-semibold"
                            >
                              #{i}
                            </Badge>
                            <div className="min-w-0 flex-1">
                              <Address pubkey={accountKeys[accountIdx]} link />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-2 font-semibold">Instruction Data:</div>
                      <pre className="bg-muted overflow-x-auto rounded-lg border p-4 font-mono text-xs">
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
          <h3 className="mb-4 border-b-2 pb-3 text-lg font-semibold">All Accounts ({accountKeys.length})</h3>
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
                const isWritable = details.meta?.preBalances[idx] !== details.meta?.postBalances[idx];
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
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
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
              <h3 className="mb-4 border-b-2 pb-3 text-lg font-semibold">Program Logs (Raw)</h3>
              <pre
                className="overflow-auto rounded-lg bg-black p-4 font-mono text-sm text-white"
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
            <h3 className="mb-4 border-b-2 pb-3 text-lg font-semibold">Balance Changes</h3>
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
                      <TableCell className="text-right font-mono">{(pre / 1e9).toFixed(9)} SOL</TableCell>
                      <TableCell className="text-right font-mono">{(post / 1e9).toFixed(9)} SOL</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono font-semibold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
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
