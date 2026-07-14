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
import { Check, X } from 'lucide-react';
import { Address } from '@/app/(shared)/components/Address';

const pk = (s: string) => ({ toBase58: () => s });

export interface VoteData {
  address: string;
  proposal: string;
  voter: string;
  choice: boolean;
  weight: number;
  votedAt: number;
}

interface VotesTableProps {
  votes: VoteData[];
}

function fmtTs(ts: number): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString();
}

export function VotesTable({ votes }: VotesTableProps) {
  return (
    <Table>
      <TableHeader className="bg-[#0a0a0a]">
        <TableRow className="border-[#2a2a2a] hover:bg-transparent">
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Proposal</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Voter</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Choice</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Weight</TableHead>
          <TableHead className="h-9 text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Voted At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {votes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-[10px] uppercase tracking-wide text-[#555]">
              No votes cast yet
            </TableCell>
          </TableRow>
        ) : (
          votes.map((v) => (
            <TableRow key={v.address} className="group border-[#1a1a1a] transition-colors hover:bg-[#9945FF]/5">
              <TableCell className="py-2 text-[10px] text-[#888] [&_a]:text-[#888] [&_a:hover]:text-[#9945FF]">
                <Address pubkey={pk(v.proposal)} link raw truncateChars={16} />
              </TableCell>
              <TableCell className="py-2 text-[10px] text-[#888] [&_a]:text-[#888] [&_a:hover]:text-[#9945FF]">
                <Address pubkey={pk(v.voter)} link raw truncateChars={16} />
              </TableCell>
              <TableCell className="py-2">
                {v.choice ? (
                  <span className="inline-flex items-center gap-1 bg-[#14F195]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#14F195]">
                    <Check className="h-3 w-3" /> For
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-[#ff3333]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff5555]">
                    <X className="h-3 w-3" /> Against
                  </span>
                )}
              </TableCell>
              <TableCell className="py-2 font-mono font-medium text-[#e0e0e0]">{v.weight.toLocaleString()}</TableCell>
              <TableCell className="py-2 text-right font-mono text-[10px] text-[#888]">{fmtTs(v.votedAt)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
