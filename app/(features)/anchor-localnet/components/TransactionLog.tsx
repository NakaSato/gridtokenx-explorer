'use client';

import React, { useState } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import {
  ScrollText,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Grid3X3,
  RefreshCw,
} from 'lucide-react';
import type { RecentTransaction } from '../hooks/useAnchorLocalnet';
import { cn } from '@/app/(shared)/utils/cn';
import { Card } from '@/app/(shared)/components/ui/card';

interface TransactionLogProps {
  transactions: RecentTransaction[];
  fetchLogs: (signature: string) => Promise<string[]>;
}

export function TransactionLog({ transactions, fetchLogs }: TransactionLogProps) {
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, string[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<string | null>(null);

  const handleExpand = async (signature: string) => {
    if (expandedTx === signature) {
      setExpandedTx(null);
      return;
    }
    setExpandedTx(signature);

    if (!logs[signature]) {
      setLoadingLogs(signature);
      const txLogs = await fetchLogs(signature);
      setLogs(prev => ({ ...prev, [signature]: txLogs }));
      setLoadingLogs(null);
    }
  };

  const copySignature = (sig: string) => {
    navigator.clipboard.writeText(sig);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
            <ScrollText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-none">Recent Transactions</h3>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              Solana Blockchain Ledger
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 font-bold border-border/60">
            {transactions.length} Total
          </Badge>
        </div>
      </div>

      <Card className="overflow-hidden border-border/60">
        <ScrollArea className="h-[480px]">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-8">
              <ScrollText className="h-10 w-10 text-muted-foreground/20 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">No transactions found for GridTokenX programs</p>
              <p className="text-xs text-muted-foreground mt-1">Execute some instructions to see them indexed here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {transactions.map((tx) => (
                <div key={tx.signature} className="group">
                  <div
                    className={cn(
                      "flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-muted/30",
                      expandedTx === tx.signature && "bg-muted/20"
                    )}
                    onClick={() => handleExpand(tx.signature)}
                  >
                    <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-background border shadow-sm">
                      {expandedTx === tx.signature ? (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="shrink-0">
                      {tx.err ? (
                        <div className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-[11px] font-bold tracking-tight">
                          {tx.signature.slice(0, 16)}...{tx.signature.slice(-12)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            copySignature(tx.signature);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        {tx.programName && (
                          <Badge variant="outline" className="text-[9px] h-4.5 font-bold border-primary/20 text-primary bg-primary/5">
                            {tx.programName}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                          <Grid3X3 className="h-3 w-3" /> Slot {tx.slot.toLocaleString()}
                        </span>
                        {tx.blockTime && (
                          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <Clock className="h-3 w-3" />
                            {new Date(tx.blockTime * 1000).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Badge
                        variant={tx.err ? 'destructive' : 'default'}
                        className={cn(
                          "h-5 text-[9px] font-bold px-2",
                          !tx.err && "bg-green-100 text-green-800 hover:bg-green-200"
                        )}
                      >
                        {tx.err ? 'REJECTED' : 'CONFIRMED'}
                      </Badge>
                    </div>
                  </div>

                  {/* Expanded Logs */}
                  {expandedTx === tx.signature && (
                    <div className="border-t border-border/40 bg-black/[0.02] dark:bg-white/[0.02] p-4">
                      <div className="rounded-xl border bg-muted/30 overflow-hidden">
                        <div className="bg-muted/50 px-3 py-1.5 border-b flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Execution Logs</span>
                          <span className="text-[9px] font-mono text-muted-foreground">{logs[tx.signature]?.length ?? 0} events</span>
                        </div>
                        <div className="p-3">
                          {loadingLogs === tx.signature ? (
                            <div className="flex items-center gap-2 py-8 justify-center">
                              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                              <span className="text-[11px] font-medium text-muted-foreground">Fetching transaction events...</span>
                            </div>
                          ) : logs[tx.signature]?.length ? (
                            <ScrollArea className="h-[240px]">
                              <div className="space-y-1 font-mono text-[10px]">
                                {logs[tx.signature].map((log, i) => {
                                  const isInvoke = log.includes('invoke');
                                  const isSuccess = log.includes('success');
                                  const isError = log.includes('failed') || log.includes('error');
                                  const isMsg = log.startsWith('Program log:');

                                  let textClass = 'text-muted-foreground/80';
                                  let bgClass = '';
                                  if (isMsg) textClass = 'text-foreground font-medium';
                                  if (isSuccess) textClass = 'text-green-600 font-bold';
                                  if (isError) {
                                    textClass = 'text-red-600 font-bold';
                                    bgClass = 'bg-red-50/50 dark:bg-red-900/10 px-1 rounded';
                                  }
                                  if (isInvoke) textClass = 'text-blue-600 font-medium';

                                  return (
                                    <div key={i} className={cn("leading-relaxed break-all", bgClass)}>
                                      <span className="text-muted-foreground/30 mr-2">{(i+1).toString().padStart(2, '0')}</span>
                                      <span className={textClass}>{log}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </ScrollArea>
                          ) : (
                            <div className="py-8 text-center">
                              <p className="text-[11px] text-muted-foreground italic">No detailed logs available for this transaction.</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase">Signature:</span>
                         <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border">{tx.signature}</code>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}
