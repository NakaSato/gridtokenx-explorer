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
import { Gauge, MapPin, Sun, Wind, Battery } from 'lucide-react';
import { cn } from '@/app/(shared)/utils/cn';

interface MeterData {
  address: string;
  meterId: string;
  owner: string;
  meterType: string;
  isActive: boolean;
  lastReading: number;
}

interface MetersTableProps {
  meters: MeterData[];
}

export function MetersTable({ meters }: MetersTableProps) {
  const getMeterIcon = (type: string) => {
    switch (type) {
      case 'Solar': return <Sun className="h-3.5 w-3.5 text-yellow-500" />;
      case 'Wind': return <Wind className="h-3.5 w-3.5 text-blue-400" />;
      case 'Battery': return <Battery className="h-3.5 w-3.5 text-green-500" />;
      default: return <Gauge className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <Table>
      <TableHeader className="bg-muted/30">
        <TableRow>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Meter ID</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Type</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Status</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold">Last Reading</TableHead>
          <TableHead className="h-9 text-[10px] uppercase font-bold text-right">Owner</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {meters.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs italic">
              No meters found in the registry
            </TableCell>
          </TableRow>
        ) : (
          meters.map((meter) => (
            <TableRow key={meter.address} className="hover:bg-muted/30 transition-colors">
              <TableCell className="py-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-bold text-xs">{meter.meterId}</span>
                </div>
              </TableCell>
              <TableCell className="py-2">
                <div className="flex items-center gap-1.5">
                  {getMeterIcon(meter.meterType)}
                  <span className="text-[11px] font-medium">{meter.meterType}</span>
                </div>
              </TableCell>
              <TableCell className="py-2">
                <Badge variant={meter.isActive ? 'default' : 'secondary'} className={cn(
                  "text-[9px] h-4.5 px-1.5",
                  meter.isActive ? "bg-green-100 text-green-800 hover:bg-green-200" : ""
                )}>
                  {meter.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </TableCell>
              <TableCell className="py-2 font-mono text-xs font-bold text-blue-600">
                {meter.lastReading.toLocaleString()} <span className="text-[9px] font-normal text-muted-foreground">kWh</span>
              </TableCell>
              <TableCell className="py-2 text-right">
                <span className="font-mono text-[9px] text-muted-foreground" title={meter.owner}>
                  {meter.owner.slice(0, 8)}...
                </span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
