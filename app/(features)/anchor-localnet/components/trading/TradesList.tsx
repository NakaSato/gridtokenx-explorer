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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center text-muted-foreground bg-background/50 backdrop-blur-sm">
        <ArrowUpDown className="mb-3 h-8 w-8 opacity-20" />
        <p className="text-sm">No trade records found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] rounded-xl border bg-background/50 shadow-sm backdrop-blur-sm">
      <div className="divide-y divide-border/50">
        {trades.map((trade) => (
          <div key={trade.address} className="group p-4 transition-colors hover:bg-muted/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ArrowUpDown className="h-4 w-4" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-base font-bold text-foreground">{trade.amount}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">kWh</span>
                  <span className="text-muted-foreground mx-1">@</span>
                  <span className="font-mono text-sm font-semibold text-foreground">{trade.pricePerKwh}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">/kWh</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-0.5">Value</p>
                <p className="font-mono font-bold text-primary">{trade.totalValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px]">Fee: {trade.feeAmount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {new Date(trade.executedAt * 1000).toLocaleString()}
                </div>
              </div>
              <p className="font-mono text-[9px] text-muted-foreground/60 group-hover:text-muted-foreground">
                {trade.address}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
