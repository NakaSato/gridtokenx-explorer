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
import { Server } from 'lucide-react';
import { cn } from '@/app/(shared)/utils/cn';
import { Address } from '@/app/(shared)/components/Address';

const pk = (s: string) => ({ toBase58: () => s });

export interface AggregatorData {
  address: string;
  aggregator: string;
  admittedAt: number;
  updatedAt: number;
  active: boolean;
  segment: string;
}

interface AggregatorsTableProps {
  aggregators: AggregatorData[];
}

function fmtTs(ts: number): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}

export function AggregatorsTable({ aggregators }: AggregatorsTableProps) {
  return (
    <Table>
      <TableHeader className="bg-[#0a0a0a]">
        <TableRow className="border-[#2a2a2a] hover:bg-transparent">
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Aggregator</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Segment</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Status</TableHead>
          <TableHead className="h-9 text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Admitted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aggregators.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center text-[10px] uppercase tracking-wide text-[#555]">
              No aggregators admitted yet
            </TableCell>
          </TableRow>
        ) : (
          aggregators.map((a) => (
            <TableRow key={a.address} className="group border-[#1a1a1a] transition-colors hover:bg-[#9945FF]/5">
              <TableCell className="py-2">
                <div className="flex items-center gap-2 text-[11px] text-[#e0e0e0] [&_a]:text-[#e0e0e0] [&_a:hover]:text-[#9945FF]">
                  <Server className="h-3.5 w-3.5 shrink-0 text-[#14F195]" />
                  <Address pubkey={pk(a.aggregator)} link raw truncateChars={20} />
                </div>
              </TableCell>
              <TableCell className="py-2">
                <span className="border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] text-[#888]">{a.segment}</span>
              </TableCell>
              <TableCell className="py-2">
                <span className={cn(
                  "px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  a.active ? "bg-[#14F195]/15 text-[#14F195]" : "bg-[#ff3333]/15 text-[#ff5555]"
                )}>
                  {a.active ? 'Active' : 'Revoked'}
                </span>
              </TableCell>
              <TableCell className="py-2 text-right font-mono text-[10px] text-[#888]">{fmtTs(a.admittedAt)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
