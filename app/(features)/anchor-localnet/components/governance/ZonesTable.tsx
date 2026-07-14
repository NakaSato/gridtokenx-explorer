'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/(shared)/components/ui/table';
import { MapPin } from 'lucide-react';
import { cn } from '@/app/(shared)/utils/cn';
import { Address } from '@/app/(shared)/components/Address';

const pk = (s: string) => ({ toBase58: () => s });

export interface ZoneData {
  address: string;
  zoneId: number;
  incentiveMultiplier: number;
  wheelingCharge: number;
  lossFactor: number;
  maintenanceMode: boolean;
  lastUpdated: number;
}

interface ZonesTableProps {
  zones: ZoneData[];
}

function fmtTs(ts: number): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}

export function ZonesTable({ zones }: ZonesTableProps) {
  return (
    <Table>
      <TableHeader className="bg-[#0a0a0a]">
        <TableRow className="border-[#2a2a2a] hover:bg-transparent">
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Zone</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Incentive</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Wheeling Charge</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Loss Factor</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Status</TableHead>
          <TableHead className="h-9 text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Last Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {zones.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center text-[10px] uppercase tracking-wide text-[#555]">
              No zones configured yet
            </TableCell>
          </TableRow>
        ) : (
          zones.map((z) => (
            <TableRow key={z.address} className="group border-[#1a1a1a] transition-colors hover:bg-[#9945FF]/5">
              <TableCell className="py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#e0e0e0] [&_a]:text-[#e0e0e0] [&_a:hover]:text-[#9945FF]">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#14F195]" />
                  <Address pubkey={pk(z.address)} link overrideText={String(z.zoneId)} />
                </div>
              </TableCell>
              <TableCell className="py-2 font-mono font-medium text-[#e0e0e0]">{(z.incentiveMultiplier / 1000).toFixed(3)}x</TableCell>
              <TableCell className="py-2 font-mono font-medium text-[#e0e0e0]">{z.wheelingCharge.toLocaleString()}</TableCell>
              <TableCell className="py-2 font-mono font-medium text-[#e0e0e0]">{(z.lossFactor / 1000).toFixed(3)}x</TableCell>
              <TableCell className="py-2">
                <span className={cn(
                  "px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  z.maintenanceMode ? "bg-[#ff3333]/15 text-[#ff5555]" : "bg-[#14F195]/15 text-[#14F195]"
                )}>
                  {z.maintenanceMode ? 'Maintenance' : 'Operational'}
                </span>
              </TableCell>
              <TableCell className="py-2 text-right font-mono text-[10px] text-[#888]">{fmtTs(z.lastUpdated)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
