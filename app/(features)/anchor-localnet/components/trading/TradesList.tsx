import React from 'react';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import { ArrowUpDown, Clock } from 'lucide-react';
import type { TradeData } from '../../hooks/useTradingExplorerData';

interface TradesListProps {
  trades: TradeData[];
}

export function TradesList({ trades }: TradesListProps) {
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-[#2a2a2a] bg-black p-12 text-center font-mono text-[#555]">
        <ArrowUpDown className="mb-3 h-8 w-8 opacity-30" />
        <p className="text-[11px] uppercase tracking-wide">No trade records found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] border border-[#2a2a2a] bg-black font-mono">
      <div className="divide-y divide-[#1a1a1a]">
        {trades.map((trade) => (
          <div key={trade.address} className="group p-3 transition-colors hover:bg-[#9945FF]/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center bg-[#9945FF]/10 text-[#9945FF]">
                  <ArrowUpDown className="h-4 w-4" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-[#e0e0e0]">{trade.amount}</span>
                  <span className="text-[10px] uppercase text-[#666]">kWh</span>
                  <span className="mx-1 text-[#666]">@</span>
                  <span className="text-sm font-bold text-[#e0e0e0]">{trade.pricePerKwh}</span>
                  <span className="text-[10px] uppercase text-[#666]">/kWh</span>
                </div>
              </div>
              <div className="text-right">
                <p className="mb-0.5 text-[9px] uppercase tracking-wider text-[#666]">Value</p>
                <p className="font-bold text-[#14F195]">{trade.totalValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] text-[#666]">
                <div className="flex items-center gap-1.5">
                  <span className="bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] text-[#888]">Fee: {trade.feeAmount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {new Date(trade.executedAt * 1000).toLocaleString()}
                </div>
              </div>
              <p className="text-[9px] text-[#555] group-hover:text-[#888]">
                {trade.address}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
