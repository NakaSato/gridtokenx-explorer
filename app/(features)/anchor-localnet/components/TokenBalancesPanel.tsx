'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import { Coins, Wallet, Zap, ArrowUpRight } from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';

interface TokenBalancesPanelProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue?: number;
}

interface WalletInfo {
  address: string;
  solBalance: number;
  tokens: TokenBalance[];
}

const KNOWN_TOKENS = [
  { mint: '2XLTgMue7MHSjZ7A25zmV9xF6ZeBz2LouZt6Y92AtN2H', symbol: 'GRX', name: 'GridTokenX Energy', decimals: 9 },
  { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'Tether', decimals: 6 },
];

export function TokenBalancesPanel({ rpcUrl, getConnection }: TokenBalancesPanelProps) {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const conn = getConnection();
      
      // Get wallet from localStorage or use a default
      const walletKey = localStorage.getItem('wallet-publicKey');
      if (!walletKey) {
        setError('No wallet connected');
        setIsLoading(false);
        return;
      }
      
      const pubkey = new PublicKey(walletKey);
      
      // Fetch SOL balance
      const solBalance = await conn.getBalance(pubkey);
      
      // Fetch token accounts
      const tokenAccounts = await conn.getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });
      
      const tokens: TokenBalance[] = tokenAccounts.value
        .map((ta) => {
          const parsed = ta.account.data.parsed.info;
          const mint = parsed.mint;
          const amount = parsed.tokenAmount.uiAmount;
          const decimals = parsed.tokenAmount.decimals;
          
          const knownToken = KNOWN_TOKENS.find(t => t.mint === mint);
          
          return {
            mint,
            symbol: knownToken?.symbol || 'UNKNOWN',
            name: knownToken?.name || 'Unknown Token',
            balance: amount,
            decimals,
          };
        })
        .filter(t => t.balance > 0);
      
      setWalletInfo({
        address: walletKey,
        solBalance: solBalance / 1e9,
        tokens,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    fetchBalances();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-green-500" />
            Token Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-green-500" />
            Token Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 text-green-500" />
          Token Balances
          <Badge variant="outline" className="text-[9px] ml-auto">
            Auto-refresh
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SOL Balance */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">SOL</span>
            </div>
            <div>
              <p className="text-sm font-medium">Solana</p>
              <p className="text-[10px] text-muted-foreground">Native Token</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-medium">
              {walletInfo?.solBalance.toFixed(4)} SOL
            </p>
          </div>
        </div>

        {/* GRX Token - Always show */}
        <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">GridTokenX</p>
              <p className="text-[10px] text-muted-foreground">GRX Energy Token</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-medium">
              {walletInfo?.tokens.find(t => t.symbol === 'GRX')?.balance.toFixed(2) || '0.00'} GRX
            </p>
          </div>
        </div>

        {/* Other Tokens */}
        {walletInfo?.tokens
          .filter(t => t.symbol !== 'GRX')
          .map((token) => (
            <div key={token.mint} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{token.name}</p>
                  <p className="text-[10px] text-muted-foreground">{token.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-medium">
                  {token.balance.toFixed(token.decimals === 6 ? 2 : 4)} {token.symbol}
                </p>
              </div>
            </div>
          ))}

        {walletInfo?.tokens.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">No token balances found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
