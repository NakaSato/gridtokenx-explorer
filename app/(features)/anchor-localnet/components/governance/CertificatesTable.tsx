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
      <TableHeader className="bg-muted/30">
        <TableRow>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Certificate ID</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Volume</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Source</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Status</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Owner</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {certificates.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs italic">
              No ERC certificates have been issued yet
            </TableCell>
          </TableRow>
        ) : (
          certificates.map((cert) => (
            <TableRow key={cert.address} className="hover:bg-muted/30 transition-colors">
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-green-500" />
                  <span className="font-bold text-xs">{cert.certificateId}</span>
                </div>
              </TableCell>
              <TableCell className="py-2 font-mono font-medium">{cert.energyAmount.toLocaleString()} <span className="text-[10px] text-muted-foreground">kWh</span></TableCell>
              <TableCell className="py-2">
                <Badge variant="outline" className="text-[10px] font-normal border-border/40">
                  {cert.renewableSource}
                </Badge>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={cn(
                    "text-[9px] h-4.5 px-1.5",
                    cert.status === 'Valid' && "bg-green-50 text-green-700 border-green-200",
                    cert.status === 'Revoked' && "bg-red-50 text-red-700 border-red-200"
                  )}>
                    {cert.status}
                  </Badge>
                  {cert.validatedForTrading && (
                    <Badge className="text-[9px] h-4.5 px-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200">TRADE</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-2">
                <p className="font-mono text-[10px] text-muted-foreground truncate w-24" title={cert.owner}>
                  {cert.owner}
                </p>
              </TableCell>
              <TableCell className="py-2 text-right">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Clock className="h-3 w-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
