'use client';

import React from 'react';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { StatItem } from '../shared-explorer/Stats';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/app/(shared)/utils/cn';

interface PoAConfigData {
  address: string;
  authority: string;
  authorityName: string;
  maintenanceMode: boolean;
  ercValidationEnabled: boolean;
  minEnergyAmount: number;
  maxErcAmount: number;
}

interface PoAConfigCardProps {
  config: PoAConfigData;
}

export function PoAConfigCard({ config }: PoAConfigCardProps) {
  return (
    <Card className="border-border/60 bg-card/50 shadow-sm overflow-hidden">
      <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Proof-of-Authority Configuration</h4>
        <div className="flex gap-2">
          <Badge variant={config.maintenanceMode ? 'destructive' : 'default'} className="h-5 text-[9px] px-2">
            {config.maintenanceMode ? 'Maintenance Mode' : 'Operational'}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 md:grid-cols-4">
          <StatItem label="Authority Name" value={config.authorityName} />
          <StatItem label="Min Energy" value={`${config.minEnergyAmount} kWh`} />
          <StatItem label="Max ERC" value={`${config.maxErcAmount} kWh`} />
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">ERC Validation</p>
            <div className="flex items-center gap-1.5 mt-1">
              <ShieldCheck className={cn("h-3.5 w-3.5", config.ercValidationEnabled ? "text-green-500" : "text-muted-foreground")} />
              <span className="text-xs font-bold">{config.ercValidationEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Authority Wallet</p>
            <p className="font-mono text-[11px] truncate mt-0.5">{config.authority}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
