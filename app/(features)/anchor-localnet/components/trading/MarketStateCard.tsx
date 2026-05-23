import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import type { MarketData } from '../../hooks/useTradingExplorerData';

interface MarketStateCardProps {
  market: MarketData | null;
}

export function MarketStateCard({ market }: MarketStateCardProps) {
  if (!market) {
    return (
      <div className="rounded-xl border border-dashed border-primary/20 bg-background/50 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          No market account found. Run <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">initialize_market</code> first.
        </p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-background/60 backdrop-blur-md transition-all hover:bg-background/80 hover:shadow-md">
      <CardHeader className="border-b border-primary/10 bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Market State</CardTitle>
          <Badge variant={market.clearingEnabled ? 'default' : 'secondary'} className="font-mono text-[10px]">
            {market.clearingEnabled ? 'Clearing Enabled' : 'Clearing Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Volume</p>
            <p className="font-mono text-lg font-semibold text-foreground">
              {market.totalVolume.toLocaleString()} <span className="text-xs text-muted-foreground">kWh</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Trades</p>
            <p className="font-mono text-lg font-semibold text-foreground">{market.totalTrades.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active Orders</p>
            <p className="font-mono text-lg font-semibold text-foreground">{market.activeOrders}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Last Price</p>
            <p className="font-mono text-lg font-semibold text-foreground">
              {market.lastClearingPrice} <span className="text-xs text-muted-foreground">/kWh</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">VWAP</p>
            <p className="font-mono text-lg font-semibold text-foreground">
              {market.vwap} <span className="text-xs text-muted-foreground">/kWh</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Fee</p>
            <p className="font-mono text-lg font-semibold text-foreground">
              {market.marketFeeBps} <span className="text-xs text-muted-foreground">bps</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Price Range</p>
            <p className="font-mono text-lg font-semibold text-foreground">
              {market.minPrice} - {market.maxPrice || '∞'}
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between rounded-lg bg-muted/40 p-3">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Authority</p>
          <p className="font-mono text-[10px] text-foreground">{market.authority}</p>
        </div>
      </CardContent>
    </Card>
  );
}
