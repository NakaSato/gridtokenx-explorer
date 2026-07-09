import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { MarketData } from '../../hooks/useTradingExplorerData';
import { fmtKwh, fmtThb } from '../../lib/units';

interface MarketStateCardProps {
  market: MarketData | null;
}

export function MarketStateCard({ market }: MarketStateCardProps) {
  if (!market) {
    return (
      <div className="border border-dashed border-[#2a2a2a] bg-black p-8 text-center font-mono">
        <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#9945FF]/10">
          <BarChart3 className="h-6 w-6 text-[#9945FF]" />
        </div>
        <p className="mt-4 text-[11px] uppercase tracking-wide text-[#888]">
          No market account found. Run <code className="bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] text-[#14F195]">initialize_market</code> first.
        </p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black font-mono">
      <CardHeader className="border-b border-[#2a2a2a] bg-[#111] py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Market State</CardTitle>
          <span
            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              market.clearingEnabled ? 'bg-[#14F195]/15 text-[#14F195]' : 'bg-[#2a2a2a] text-[#888]'
            }`}
          >
            {market.clearingEnabled ? 'Clearing Enabled' : 'Clearing Disabled'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {[
            ['Total Volume', fmtKwh(market.totalVolume), 'kWh'],
            ['Total Trades', market.totalTrades.toLocaleString(), ''],
            ['Active Orders', String(market.activeOrders), ''],
            ['Last Price', `฿${fmtThb(market.lastClearingPrice)}`, '/kWh'],
            ['VWAP', `฿${fmtThb(market.vwap)}`, '/kWh'],
            ['Fee', String(market.marketFeeBps), 'bps'],
            ['Price Range', `฿${fmtThb(market.minPrice)} - ${market.maxPrice ? `฿${fmtThb(market.maxPrice)}` : '∞'}`, ''],
          ].map(([label, value, unit]) => (
            <div key={label} className="space-y-1 border-b border-r border-[#1a1a1a] p-3">
              <p className="text-[9px] font-medium uppercase tracking-wider text-[#666]">{label}</p>
              <p className="text-base font-bold text-[#e0e0e0]">
                {value} {unit && <span className="text-[10px] text-[#666]">{unit}</span>}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-[#0a0a0a] p-3">
          <p className="text-[9px] font-medium uppercase tracking-wider text-[#666]">Authority</p>
          <p className="text-[10px] text-[#14F195]">{market.authority}</p>
        </div>
      </CardContent>
    </Card>
  );
}
