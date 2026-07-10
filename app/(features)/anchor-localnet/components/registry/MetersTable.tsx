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
import { Gauge, Sun, Wind, Battery } from 'lucide-react';
import { Address } from '@/app/(shared)/components/Address';

/** Plain pubkey-like wrapper so <Address> never constructs a web3.js PublicKey
 * (dodges the dual-package `instanceof` trap under Turbopack). */
const pk = (address: string) => ({ toBase58: () => address });

interface MeterData {
  address: string;
  meterId: string;
  owner: string;
  meterType: string;
  isActive: boolean;
  lastReadingAt: number;
  totalGeneration: number;
}

function formatLastReadingAt(unixSeconds: number): string {
  if (!unixSeconds) return 'never';
  return new Date(unixSeconds * 1000).toLocaleString();
}

interface MetersTableProps {
  meters: MeterData[];
}

export function MetersTable({ meters }: MetersTableProps) {
  const getMeterIcon = (type: string) => {
    switch (type) {
      case 'Solar': return <Sun className="h-3.5 w-3.5 text-[#ff8c00]" />;
      case 'Wind': return <Wind className="h-3.5 w-3.5 text-[#9945FF]" />;
      case 'Battery': return <Battery className="h-3.5 w-3.5 text-[#14F195]" />;
      default: return <Gauge className="h-3.5 w-3.5 text-[#666]" />;
    }
  };

  return (
    <Table className="font-mono">
      <TableHeader className="bg-[#0a0a0a]">
        <TableRow className="border-[#2a2a2a] hover:bg-transparent">
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666]">Meter ID</TableHead>
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666]">Type</TableHead>
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666]">Status</TableHead>
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666]">Total Gen</TableHead>
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666]">Last Reading</TableHead>
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666]">Owner</TableHead>
          <TableHead className="h-9 text-[9px] uppercase font-bold tracking-wider text-[#666] text-right">Meter (PDA)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {meters.length === 0 ? (
          <TableRow className="border-[#1a1a1a]">
            <TableCell colSpan={7} className="h-32 text-center text-[#555] text-xs italic">
              No meters found in the registry
            </TableCell>
          </TableRow>
        ) : (
          meters.map((meter) => (
            <TableRow key={meter.address} className="border-[#1a1a1a] hover:bg-[#9945FF]/5 transition-colors">
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-3.5 w-3.5 text-[#666]" />
                  <span className="font-bold text-xs text-[#e0e0e0]">{meter.meterId}</span>
                </div>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-1.5">
                  {getMeterIcon(meter.meterType)}
                  <span className="text-[11px] font-medium text-[#e0e0e0]">{meter.meterType}</span>
                </div>
              </TableCell>
              <TableCell className="py-2">
                {meter.isActive ? (
                  <span className="bg-[#14F195]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#14F195]">
                    ACTIVE
                  </span>
                ) : (
                  <span className="bg-[#ff3333]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff5555]">
                    INACTIVE
                  </span>
                )}
              </TableCell>
              <TableCell className="py-2 font-mono text-xs font-bold text-[#14F195]">
                {meter.totalGeneration.toLocaleString()} <span className="text-[9px] font-normal text-[#666]">kWh</span>
              </TableCell>
              <TableCell className="py-2 font-mono text-[10px] text-[#888]">
                {formatLastReadingAt(meter.lastReadingAt)}
              </TableCell>
              <TableCell className="py-2">
                <div className="font-mono text-[10px] text-[#888] hover:text-[#9945FF]">
                  <Address pubkey={pk(meter.owner)} link raw />
                </div>
              </TableCell>
              <TableCell className="py-2 text-right">
                <div className="font-mono text-[10px] text-[#888] hover:text-[#9945FF]">
                  <Address pubkey={pk(meter.address)} link raw alignRight />
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
