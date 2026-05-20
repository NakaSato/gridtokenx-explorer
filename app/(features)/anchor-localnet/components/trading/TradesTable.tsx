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
import { ArrowUpDown, Clock } from 'lucide-react';

interface TradeData {
  address: string;
  buyOrder: string;
  sellOrder: string;
  energyAmount: number;
  pricePerKwh: number;
  executedAt: number;
}

interface TradesTableProps {
  trades: TradeData[];
}

export function TradesTable({ trades }: TradesTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/30">
        <TableRow>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Execution ID</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Volume (kWh)</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Price (THB)</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Buyer/Seller</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold text-right">Settled At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs italic">
              No trades have been executed yet
            </TableCell>
          </TableRow>
        ) : (
          trades.map((trade) => (
            <TableRow key={trade.address} className="hover:bg-muted/30 transition-colors">
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-mono text-[10px] font-bold">{trade.address.slice(0, 8)}...</span>
                </div>
              </TableCell>
              <TableCell className="py-2 font-mono text-xs font-bold">{trade.energyAmount}</TableCell>
              <TableCell className="py-2 font-mono text-xs font-bold text-green-600">{trade.pricePerKwh}</TableCell>
              <TableCell className="py-2">
                <div className="flex flex-col gap-0.5 text-[9px] font-mono text-muted-foreground">
                  <span className="truncate w-32">B: {trade.buyOrder}</span>
                  <span className="truncate w-32">S: {trade.sellOrder}</span>
                </div>
              </TableCell>
              <TableCell className="py-2 text-right">
                <div className="flex items-center justify-end gap-1.5 text-[9px] text-muted-foreground font-mono">
                  <Clock className="h-3 w-3" />
                  {new Date(trade.executedAt * 1000).toLocaleTimeString()}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
