'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/(shared)/components/ui/dialog';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/(shared)/components/ui/tabs';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import { Copy, ExternalLink, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';

interface AccountDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  getConnection: () => Connection;
}

interface AccountData {
  address: string;
  lamports: number;
  owner: string;
  executable: boolean;
  dataSize: number;
  data: Buffer | null;
}

interface TransactionInfo {
  signature: string;
  slot: number;
  blockTime: number | null;
  status: 'success' | 'error';
  type: string;
}

export function AccountDetailDialog({ open, onOpenChange, address, getConnection }: AccountDetailDialogProps) {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!open || !address) return;
    
    const fetchAccountData = async () => {
      setIsLoading(true);
      try {
        const conn = getConnection();
        const pubkey = new PublicKey(address);
        
        // Fetch account info
        const accountInfo = await conn.getAccountInfo(pubkey);
        
        if (accountInfo) {
          setAccount({
            address,
            lamports: accountInfo.lamports,
            owner: accountInfo.owner.toBase58(),
            executable: accountInfo.executable,
            dataSize: accountInfo.data.length,
            data: Buffer.from(accountInfo.data),
          });
        }
        
        // Fetch transaction signatures
        const signatures = await conn.getSignaturesForAddress(pubkey, { limit: 20 });
        const txs: TransactionInfo[] = signatures.map(sig => ({
          signature: sig.signature,
          slot: sig.slot,
          blockTime: sig.blockTime ?? null,
          status: sig.err ? 'error' : 'success',
          type: sig.memo || 'Transaction',
        }));
        
        setTransactions(txs);
      } catch (err) {
        console.error('Failed to fetch account details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAccountData();
  }, [open, address, getConnection]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatSOL = (lamports: number) => {
    return (lamports / 1_000_000_000).toFixed(9);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Account Details
            <Badge variant="outline" className="font-mono text-[9px]">
              {address.slice(0, 8)}...{address.slice(-8)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : account ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="data">Raw Data</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Address</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono">{address}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Balance</span>
                  <span className="font-mono text-sm font-medium">
                    {formatSOL(account.lamports)} SOL
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Owner</span>
                  <code className="text-xs font-mono">{account.owner.slice(0, 16)}...</code>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Executable</span>
                  <Badge variant={account.executable ? 'default' : 'secondary'} className="text-[10px]">
                    {account.executable ? 'Yes' : 'No'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Data Size</span>
                  <span className="font-mono text-sm">{account.dataSize} bytes</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="data">
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {account.data ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">Base64:</p>
                    <code className="block text-[10px] font-mono break-all">
                      {account.data.toString('base64')}
                    </code>
                    <p className="text-xs text-muted-foreground mb-2 mt-4">Hex:</p>
                    <code className="block text-[10px] font-mono break-all">
                      {account.data.toString('hex')}
                    </code>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No data available</p>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="transactions">
              <ScrollArea className="h-[300px] rounded-md border">
                {transactions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No transactions found
                  </div>
                ) : (
                  <div className="divide-y">
                    {transactions.map((tx) => (
                      <div key={tx.signature} className="p-3 text-xs hover:bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {tx.status === 'success' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span className="font-mono">{tx.signature.slice(0, 16)}...</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => window.open(`https://explorer.solana.com/tx/${tx.signature}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'Unknown'}
                          </span>
                          <span>Slot: {tx.slot}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Account not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
