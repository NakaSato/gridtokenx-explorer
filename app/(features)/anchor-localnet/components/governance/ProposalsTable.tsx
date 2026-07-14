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
import { Vote } from 'lucide-react';
import { cn } from '@/app/(shared)/utils/cn';
import { Address } from '@/app/(shared)/components/Address';

const pk = (s: string) => ({ toBase58: () => s });

export interface ProposalData {
  address: string;
  proposer: string;
  targetZone: number;
  parameter: string;
  newValue: number;
  votesFor: number;
  votesAgainst: number;
  status: string;
  expiresAt: number;
  proposalId: number;
}

interface ProposalsTableProps {
  proposals: ProposalData[];
}

function fmtTs(ts: number): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}

export function ProposalsTable({ proposals }: ProposalsTableProps) {
  return (
    <Table>
      <TableHeader className="bg-[#0a0a0a]">
        <TableRow className="border-[#2a2a2a] hover:bg-transparent">
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">ID</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Zone</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Parameter</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">New Value</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Votes (For / Against)</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Status</TableHead>
          <TableHead className="h-9 text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Expires</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center text-[10px] uppercase tracking-wide text-[#555]">
              No proposals submitted yet
            </TableCell>
          </TableRow>
        ) : (
          proposals.map((p) => (
            <TableRow key={p.address} className="group border-[#1a1a1a] transition-colors hover:bg-[#9945FF]/5">
              <TableCell className="py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#e0e0e0] [&_a]:text-[#e0e0e0] [&_a:hover]:text-[#9945FF]">
                  <Vote className="h-3.5 w-3.5 shrink-0 text-[#14F195]" />
                  <Address pubkey={pk(p.address)} link overrideText={`#${p.proposalId}`} />
                </div>
                <div className="mt-0.5 pl-5 text-[9px] text-[#666] [&_a]:text-[#666] [&_a:hover]:text-[#9945FF]">
                  <Address pubkey={pk(p.proposer)} link raw truncateChars={12} />
                </div>
              </TableCell>
              <TableCell className="py-2 font-mono text-[#e0e0e0]">{p.targetZone}</TableCell>
              <TableCell className="py-2">
                <span className="border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] text-[#888]">{p.parameter}</span>
              </TableCell>
              <TableCell className="py-2 font-mono font-medium text-[#e0e0e0]">{p.newValue.toLocaleString()}</TableCell>
              <TableCell className="py-2 font-mono text-[11px]">
                <span className="text-[#14F195]">{p.votesFor.toLocaleString()}</span>
                <span className="mx-1 text-[#444]">/</span>
                <span className="text-[#ff5555]">{p.votesAgainst.toLocaleString()}</span>
              </TableCell>
              <TableCell className="py-2">
                <span className={cn(
                  "px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  p.status === 'Active' && "bg-[#9945FF]/15 text-[#9945FF]",
                  p.status === 'Passed' && "bg-[#14F195]/15 text-[#14F195]",
                  p.status === 'Executed' && "bg-[#14F195]/15 text-[#14F195]",
                  p.status === 'Rejected' && "bg-[#ff3333]/15 text-[#ff5555]",
                  p.status === 'Cancelled' && "bg-[#ff8c00]/15 text-[#ff8c00]",
                )}>
                  {p.status}
                </span>
              </TableCell>
              <TableCell className="py-2 text-right font-mono text-[10px] text-[#888]">{fmtTs(p.expiresAt)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
