'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import { RefreshCw, Zap, Plus, TrendingUp, ShoppingCart, ArrowUpDown, Database } from 'lucide-react';
import { Connection } from '@solana/web3.js';

import { PROGRAMS } from '../config';
import type { ProgramKey } from '../config';
import { useTradingExplorerData } from '../hooks/useTradingExplorerData';

import { MarketStateCard } from './trading/MarketStateCard';
import { OrdersList } from './trading/OrdersList';
import { TradesList } from './trading/TradesList';
import { SettlementStats } from './trading/SettlementStats';
import { PlaceOrderDialog } from './trading/PlaceOrderDialog';

interface TradingExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
  fetchProgramAccounts: (key: ProgramKey) => Promise<void>;
}

export function TradingExplorer({ rpcUrl, getConnection }: TradingExplorerProps) {
  const { market, orders, trades, settlementStats, isLoading, fetchData } = useTradingExplorerData(getConnection);
  const [activeView, setActiveView] = useState<'market' | 'orders' | 'trades' | 'settlement'>('market');
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-4 pt-4">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-primary/10 via-background to-background p-6 border border-primary/10 shadow-sm backdrop-blur-md">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-inner">
              <Zap className="h-5 w-5" />
            </div>
            Trading Program Dashboard
          </h3>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            Program ID: 
            <Badge variant="outline" className="font-mono text-[10px] tracking-widest bg-background/50">
              {PROGRAMS.trading.id}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="h-10 px-4 shadow-md hover:shadow-lg transition-all"
            onClick={() => setShowPlaceOrder(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Place Order
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 border-primary/20 bg-background/50 backdrop-blur-sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Market & Cost */}
        <div className="space-y-8 lg:col-span-1">
          <MarketStateCard market={market} />
          
          {/* Instructions reference */}
          <div className="rounded-xl border border-primary/10 bg-muted/10 p-5 backdrop-blur-sm">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Instructions</h4>
            <div className="flex flex-wrap gap-2">
              {PROGRAMS.trading.instructions.map((ix) => (
                <Badge key={ix} variant="secondary" className="font-mono text-[9px] hover:bg-primary/20 transition-colors">
                  {ix}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Data Views */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap gap-2 p-1 bg-muted/30 rounded-xl w-fit backdrop-blur-sm">
            <Button
              variant={activeView === 'market' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-lg transition-all ${activeView === 'market' ? 'shadow-sm' : ''}`}
              onClick={() => setActiveView('market')}
            >
              <TrendingUp className="mr-2 h-4 w-4" /> Overview
            </Button>
            <Button
              variant={activeView === 'orders' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-lg transition-all ${activeView === 'orders' ? 'shadow-sm' : ''}`}
              onClick={() => setActiveView('orders')}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Orders 
              <Badge variant="secondary" className="ml-2 bg-background/50 text-[10px]">{orders.length}</Badge>
            </Button>
            <Button
              variant={activeView === 'trades' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-lg transition-all ${activeView === 'trades' ? 'shadow-sm' : ''}`}
              onClick={() => setActiveView('trades')}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" /> Trades
              <Badge variant="secondary" className="ml-2 bg-background/50 text-[10px]">{trades.length}</Badge>
            </Button>
            <Button
              variant={activeView === 'settlement' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-lg transition-all ${activeView === 'settlement' ? 'shadow-sm' : ''}`}
              onClick={() => setActiveView('settlement')}
            >
              <Database className="mr-2 h-4 w-4" /> Settlements
            </Button>
          </div>

          <div className="min-h-[400px]">
            {activeView === 'market' && (
              <div className="flex flex-col items-center justify-center h-full rounded-xl border border-dashed p-12 text-center text-muted-foreground bg-background/50 backdrop-blur-sm">
                <TrendingUp className="mb-4 h-12 w-12 opacity-20 text-primary" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Market Overview</h3>
                <p className="text-sm max-w-sm">
                  Select a tab above to view active orders, recent trade history, or settlement operations. The market state is always visible on the left.
                </p>
              </div>
            )}
            
            {activeView === 'orders' && <OrdersList orders={orders} />}
            
            {activeView === 'trades' && <TradesList trades={trades} />}
            
            {activeView === 'settlement' && (
              <SettlementStats stats={settlementStats} onMatchSuccess={fetchData} />
            )}
          </div>
        </div>
      </div>

      <PlaceOrderDialog
        open={showPlaceOrder}
        onOpenChange={setShowPlaceOrder}
        rpcUrl={rpcUrl}
        onSuccess={fetchData}
      />
    </div>
  );
}
