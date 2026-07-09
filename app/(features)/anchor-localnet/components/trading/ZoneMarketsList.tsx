import React from 'react';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import { Map } from 'lucide-react';
import type { ZoneMarketData } from '../../lib/trading-decoders';
import { fmtKwh, fmtThb } from '../../lib/units';

interface ZoneMarketsListProps {
  zoneMarkets: ZoneMarketData[];
}

export function ZoneMarketsList({ zoneMarkets }: ZoneMarketsListProps) {
  if (zoneMarkets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-[#2a2a2a] bg-black p-12 text-center font-mono text-[#555]">
        <Map className="mb-3 h-8 w-8 opacity-30" />
        <p className="text-[11px] uppercase tracking-wide">No zone markets found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] border border-[#2a2a2a] bg-black font-mono">
      <div className="divide-y divide-[#1a1a1a]">
        {zoneMarkets.map(zone => {
          const utilizationPct = zone.capacity > 0 ? Math.min(100, (zone.committedFlow / zone.capacity) * 100) : 0;
          return (
            <div key={zone.address} className="group p-3 transition-colors hover:bg-[#9945FF]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-[#9945FF]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#9945FF]">
                    Zone {zone.zoneId}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-[#e0e0e0]">{fmtKwh(zone.totalVolume)}</span>
                    <span className="text-[10px] uppercase text-[#666]">kWh volume</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-[#888]">
                  <span>
                    <span className="text-[#14F195]">{zone.activeOrders}</span> orders
                  </span>
                  <span>
                    <span className="text-[#14F195]">{zone.totalTrades}</span> trades
                  </span>
                  <span>
                    clear <span className="text-[#e0e0e0]">฿{fmtThb(zone.lastClearingPrice)}</span>
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-[#666]">
                  <span>
                    depth {zone.buyDepth.length} buy / {zone.sellDepth.length} sell
                  </span>
                  <span>shards {zone.numShards}</span>
                </div>
                <div className="flex flex-1 items-center justify-end gap-2">
                  <span className="text-[9px] uppercase tracking-wider text-[#666]">
                    capacity {fmtKwh(zone.committedFlow)}/{fmtKwh(zone.capacity)} kWh
                  </span>
                  <div className="h-1.5 w-28 bg-[#1a1a1a]">
                    <div
                      className={`h-full ${utilizationPct > 90 ? 'bg-[#ff5555]' : 'bg-[#14F195]'}`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-1.5 truncate text-[9px] tracking-wider text-[#444] group-hover:text-[#666]">
                {zone.address}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
