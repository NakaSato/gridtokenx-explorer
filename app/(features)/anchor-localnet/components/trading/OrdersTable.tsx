'use client';

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/app/(shared)/components/ui/table';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { ShoppingCart, ArrowUpDown, Clock } from 'lucide-react';
import { cn } from '@/app/(shared)/utils/cn';

interface OrderData {
  address: string;
  orderId: number;
  owner: string;
  orderType: string;
  energyAmount: number;
  energyFilled: number;
  pricePerKwh: number;
  status: string;
  createdAt: number;
}

interface OrdersTableProps {
  orders: OrderData[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/30">
        <TableRow>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Order ID</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Type</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Amount (kWh)</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Price (THB)</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Status</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Owner</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs italic">
              No active orders found in the market
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order) => (
            <TableRow key={order.address} className="hover:bg-muted/30 transition-colors">
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-bold text-xs">{order.orderId}</span>
                </div>
              </TableCell>
              <TableCell className="py-2">
                <Badge variant="outline" className={cn(
                  "text-[9px] h-4.5 px-1.5 font-bold border-transparent",
                  order.orderType === 'Buy' ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
                )}>
                  {order.orderType.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex flex-col">
                  <span className="font-mono text-xs font-bold">{order.energyAmount}</span>
                  <span className="text-[9px] text-muted-foreground">Filled: {order.energyFilled}</span>
                </div>
              </TableCell>
              <TableCell className="py-2 font-mono text-xs font-bold text-yellow-600">
                {order.pricePerKwh.toLocaleString()}
              </TableCell>
              <TableCell className="py-2">
                <Badge variant="outline" className={cn(
                  "text-[9px] h-4.5 px-1.5 border-border/40",
                  order.status === 'Open' && "bg-green-50 text-green-700",
                  order.status === 'Filled' && "bg-muted text-muted-foreground"
                )}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell className="py-2">
                <p className="font-mono text-[10px] text-muted-foreground truncate w-24" title={order.owner}>
                  {order.owner}
                </p>
              </TableCell>
              <TableCell className="py-2 text-right">
                <div className="flex items-center justify-end gap-1.5 text-[9px] text-muted-foreground font-mono">
                  <Clock className="h-3 w-3" />
                  {new Date(order.createdAt * 1000).toLocaleTimeString()}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
