'use client';

import React, { useState, useEffect } from 'react';
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
  fetchProgramAccounts?: (key: ProgramKey) => Promise<void>;
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
      <div className="space-y-2 bg-black p-2 font-mono">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48 rounded-none bg-[#1a1a1a]" />
          <Skeleton className="h-8 w-24 rounded-none bg-[#1a1a1a]" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-none bg-[#1a1a1a]" />
        <Skeleton className="h-[400px] w-full rounded-none bg-[#1a1a1a]" />
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-black p-2 font-mono text-[#e0e0e0]">
      {/* Header — function bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#2a2a2a] bg-[#111] px-3 py-2">
        <div>
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">
            <Zap className="h-3.5 w-3.5" />
            Trading Program Dashboard
          </h3>
          <div className="mt-1.5 flex items-center gap-2 text-[9px] uppercase tracking-wider text-[#666]">
            Program ID:
            <span className="bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] tracking-widest text-[#14F195]">
              {PROGRAMS.trading.id}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 rounded-none bg-[#9945FF] px-3 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#7d37d6]"
            onClick={() => setShowPlaceOrder(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Place Order
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-none border-[#2a2a2a] bg-[#0a0a0a] hover:bg-[#9945FF]/10"
            onClick={fetchData}
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#9945FF]" />
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-2 lg:grid-cols-3">
        {/* Left Column: Market & Cost */}
        <div className="space-y-2 lg:col-span-1">
          <MarketStateCard market={market} />

          {/* Instructions reference */}
          <div className="border border-[#2a2a2a] bg-black p-3">
            <h4 className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#9945FF]">Available Instructions</h4>
            <div className="flex flex-wrap gap-1.5">
              {PROGRAMS.trading.instructions.map((ix) => (
                <span key={ix} className="border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-0.5 font-mono text-[9px] text-[#888] transition-colors hover:border-[#9945FF]/50 hover:text-[#14F195]">
                  {ix}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Data Views */}
        <div className="space-y-2 lg:col-span-2">
          <div className="flex w-fit flex-wrap border border-[#2a2a2a] bg-[#111]">
            {([
              ['market', 'Overview', TrendingUp, null],
              ['orders', 'Orders', ShoppingCart, orders.length],
              ['trades', 'Trades', ArrowUpDown, trades.length],
              ['settlement', 'Settlements', Database, null],
            ] as const).map(([view, label, Icon, count]) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`flex items-center gap-1.5 border-r border-[#2a2a2a] px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors last:border-r-0 ${
                  activeView === view ? 'bg-[#9945FF] text-white' : 'text-[#888] hover:text-[#e0e0e0]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
                {count !== null && (
                  <span className={`px-1 text-[9px] ${activeView === view ? 'text-white/80' : 'text-[#14F195]'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeView === 'market' && (
              <div className="flex h-full flex-col items-center justify-center border border-dashed border-[#2a2a2a] bg-black p-12 text-center text-[#555]">
                <TrendingUp className="mb-4 h-12 w-12 text-[#9945FF] opacity-30" />
                <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-[#9945FF]">Market Overview</h3>
                <p className="max-w-sm text-[11px] uppercase tracking-wide text-[#666]">
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
