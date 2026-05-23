import React from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import { Clock, ShoppingCart } from 'lucide-react';
import type { OrderData } from '../../hooks/useTradingExplorerData';

interface OrdersListProps {
  orders: OrderData[];
}

export function OrdersList({ orders }: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center text-muted-foreground bg-background/50 backdrop-blur-sm">
        <ShoppingCart className="mb-3 h-8 w-8 opacity-20" />
        <p className="text-sm">No orders found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] rounded-xl border bg-background/50 shadow-sm backdrop-blur-sm">
      <div className="divide-y divide-border/50">
        {orders.map((order) => (
          <div key={order.address} className="group p-4 transition-colors hover:bg-muted/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge
                  variant={order.orderType === 'Buy' ? 'default' : 'destructive'}
                  className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shadow-sm"
                >
                  {order.orderType}
                </Badge>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-base font-bold text-foreground">{order.amount}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">kWh</span>
                </div>
                <span className="text-muted-foreground">@</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-sm font-semibold text-foreground">{order.pricePerKwh}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">/kWh</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-background">
                {order.status}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40"></span>
                  Filled: {order.filledAmount}/{order.amount}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {new Date(order.createdAt * 1000).toLocaleString()}
                </div>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/60 group-hover:text-muted-foreground">
                {order.address}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
