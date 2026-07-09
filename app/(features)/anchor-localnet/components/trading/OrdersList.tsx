import React from 'react';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import { Clock, ShoppingCart } from 'lucide-react';
import type { OrderData } from '../../hooks/useTradingExplorerData';
import { fmtKwh, fmtThb } from '../../lib/units';

interface OrdersListProps {
  orders: OrderData[];
}

export function OrdersList({ orders }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-[#2a2a2a] bg-black p-12 text-center font-mono text-[#555]">
        <ShoppingCart className="mb-3 h-8 w-8 opacity-30" />
        <p className="text-[11px] uppercase tracking-wide">No orders found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] border border-[#2a2a2a] bg-black font-mono">
      <div className="divide-y divide-[#1a1a1a]">
        {orders.map((order) => {
          const isBuy = order.orderType === 'Buy';
          return (
            <div key={order.address} className="group p-3 transition-colors hover:bg-[#9945FF]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isBuy ? 'bg-[#14F195]/15 text-[#14F195]' : 'bg-[#ff3333]/15 text-[#ff5555]'
                    }`}
                  >
                    {order.orderType}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-bold text-[#e0e0e0]">{fmtKwh(order.amount)}</span>
                    <span className="text-[10px] uppercase text-[#666]">kWh</span>
                  </div>
                  <span className="text-[#666]">@</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-[#e0e0e0]">฿{fmtThb(order.pricePerKwh)}</span>
                    <span className="text-[10px] uppercase text-[#666]">/kWh</span>
                  </div>
                </div>
                <span className="border border-[#2a2a2a] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#888]">
                  {order.status}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] text-[#666]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#9945FF]/60"></span>
                    Filled: {fmtKwh(order.filledAmount)}/{fmtKwh(order.amount)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {new Date(order.createdAt * 1000).toLocaleString()}
                  </div>
                </div>
                <p className="text-[9px] text-[#555] group-hover:text-[#888]">
                  {order.address}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
