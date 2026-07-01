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
import { Button } from '@/app/(shared)/components/ui/button';
import { FileCheck, Clock } from 'lucide-react';
import { cn } from '@/app/(shared)/utils/cn';

interface CertificateData {
  address: string;
  certificateId: string;
  owner: string;
  renewableSource: string;
  energyAmount: number;
  status: string;
  validatedForTrading: boolean;
  createdAt: number;
}

interface CertificatesTableProps {
  certificates: CertificateData[];
}

export function CertificatesTable({ certificates }: CertificatesTableProps) {
  return (
    <Table>
      <TableHeader className="bg-[#0a0a0a]">
        <TableRow className="border-[#2a2a2a] hover:bg-transparent">
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Certificate ID</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Volume</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Source</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Status</TableHead>
          <TableHead className="h-9 text-[9px] font-bold uppercase tracking-wider text-[#666]">Owner</TableHead>
          <TableHead className="h-9 text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {certificates.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-32 text-center text-[10px] uppercase tracking-wide text-[#555]">
              No ERC certificates have been issued yet
            </TableCell>
          </TableRow>
        ) : (
          certificates.map((cert) => (
            <TableRow key={cert.address} className="group border-[#1a1a1a] transition-colors hover:bg-[#9945FF]/5">
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-[#14F195]" />
                  <span className="text-xs font-bold text-[#e0e0e0] transition-colors group-hover:text-[#9945FF]">{cert.certificateId}</span>
                </div>
              </TableCell>
              <TableCell className="py-2 font-mono font-medium text-[#e0e0e0]">{cert.energyAmount.toLocaleString()} <span className="text-[10px] text-[#666]">kWh</span></TableCell>
              <TableCell className="py-2">
                <span className="border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] text-[#888]">
                  {cert.renewableSource}
                </span>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    cert.status === 'Valid' && "bg-[#14F195]/15 text-[#14F195]",
                    cert.status === 'Revoked' && "bg-[#ff3333]/15 text-[#ff5555]",
                    cert.status !== 'Valid' && cert.status !== 'Revoked' && "bg-[#ff8c00]/15 text-[#ff8c00]"
                  )}>
                    {cert.status}
                  </span>
                  {cert.validatedForTrading && (
                    <span className="bg-[#9945FF]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#9945FF]">TRADE</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-2">
                <p className="w-24 truncate font-mono text-[10px] text-[#888]" title={cert.owner}>
                  {cert.owner}
                </p>
              </TableCell>
              <TableCell className="py-2 text-right">
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none hover:bg-[#9945FF]/20">
                  <Clock className="h-3 w-3 text-[#9945FF]" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
