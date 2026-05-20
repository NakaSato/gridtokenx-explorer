'use client';

import React from 'react';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { StatItem } from '../shared-explorer/Stats';

interface MarketData {
  totalVolume: number;
  totalTrades: number;
  lastPrice: number;
  clearingEnabled: boolean;
  minPrice: number;
}

interface MarketStatsCardProps {
  market: MarketData;
}

export function MarketStatsCard({ market }: MarketStatsCardProps) {
  return (
    <Card className="border-border/60 bg-card/50 shadow-sm overflow-hidden">
      <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Market Configuration & Stats</h4>
        <Badge variant={market.clearingEnabled ? 'default' : 'secondary'} className="h-5 text-[9px] px-2">
          Clearing {market.clearingEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4 md:grid-cols-5">
          <StatItem label="Total Volume" value={`${market.totalVolume.toLocaleString()} kWh`} />
          <StatItem label="Total Trades" value={market.totalTrades.toLocaleString()} />
          <StatItem label="Last Price" value={`${market.lastPrice.toLocaleString()} THB`} color="text-yellow-600" />
          <StatItem label="Min Price" value={`${market.minPrice} THB`} />
          <div className="sm:col-span-1">
             <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Status</p>
             <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-200 h-5 text-[10px]">Open for Trading</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
