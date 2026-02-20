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
} from 'lucide-react';
import type { RecentTransaction } from '../hooks/useAnchorLocalnet';

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
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <ScrollText className="h-4 w-4 text-orange-500" />
          Recent Transactions ({transactions.length})
        </h3>
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No transactions found for GridTokenX programs.
            <br />
            Execute some instructions to see them here.
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((tx) => (
              <div key={tx.signature} className="text-xs">
                <div
                  className="flex cursor-pointer items-center gap-2 p-3 hover:bg-muted/30"
                  onClick={() => handleExpand(tx.signature)}
                >
                  {expandedTx === tx.signature ? (
                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  )}

                  {tx.err ? (
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-[11px]">
                        {tx.signature.slice(0, 20)}...{tx.signature.slice(-8)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          copySignature(tx.signature);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      {tx.programName && (
                        <Badge variant="outline" className="text-[9px]">{tx.programName}</Badge>
                      )}
                      <span>Slot {tx.slot.toLocaleString()}</span>
                      {tx.blockTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(tx.blockTime * 1000).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant={tx.err ? 'destructive' : 'default'}
                    className="flex-shrink-0 text-[9px]"
                  >
                    {tx.err ? 'Failed' : 'Success'}
                  </Badge>
                </div>

                {/* Expanded Logs */}
                {expandedTx === tx.signature && (
                  <div className="border-t bg-muted/20 px-4 py-3">
                    {loadingLogs === tx.signature ? (
                      <p className="text-[10px] text-muted-foreground">Loading logs...</p>
                    ) : logs[tx.signature]?.length ? (
                      <div className="space-y-0.5">
                        <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
                          Program Logs ({logs[tx.signature].length} lines)
                        </p>
                        <ScrollArea className="h-[200px]">
                          {logs[tx.signature].map((log, i) => {
                            const isProgram = log.startsWith('Program ');
                            const isInvoke = log.includes('invoke');
                            const isSuccess = log.includes('success');
                            const isError = log.includes('failed') || log.includes('error');
                            const isMsg = log.startsWith('Program log:');

                            let textClass = 'text-muted-foreground';
                            if (isMsg) textClass = 'text-foreground';
                            if (isSuccess) textClass = 'text-green-500';
                            if (isError) textClass = 'text-red-500';
                            if (isInvoke) textClass = 'text-blue-500';

                            return (
                              <p
                                key={i}
                                className={`font-mono text-[9px] leading-relaxed ${textClass}`}
                              >
                                {log}
                              </p>
                            );
                          })}
                        </ScrollArea>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">No logs available</p>
                    )}
                    <p className="mt-2 font-mono text-[9px] text-muted-foreground">
                      Full signature: {tx.signature}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
