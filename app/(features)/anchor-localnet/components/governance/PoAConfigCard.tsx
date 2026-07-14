'use client';

import React from 'react';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { StatItem } from '../shared-explorer/Stats';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/app/(shared)/utils/cn';
import { Address } from '@/app/(shared)/components/Address';

const pk = (s: string) => ({ toBase58: () => s });

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
    <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black font-mono">
      <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#111] px-4 py-2">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Proof-of-Authority Configuration</h4>
        <div className="flex gap-2">
          <span className={cn(
            "px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            config.maintenanceMode ? "bg-[#ff3333]/15 text-[#ff5555]" : "bg-[#14F195]/15 text-[#14F195]"
          )}>
            {config.maintenanceMode ? 'Maintenance Mode' : 'Operational'}
          </span>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 md:grid-cols-4">
          <StatItem label="Authority Name" value={config.authorityName} color="text-[#e0e0e0]" />
          <StatItem label="Min Energy" value={`${config.minEnergyAmount} kWh`} color="text-[#e0e0e0]" />
          <StatItem label="Max ERC" value={`${config.maxErcAmount} kWh`} color="text-[#e0e0e0]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#666]">ERC Validation</p>
            <div className="mt-1 flex items-center gap-1.5">
              <ShieldCheck className={cn("h-3.5 w-3.5", config.ercValidationEnabled ? "text-[#14F195]" : "text-[#555]")} />
              <span className={cn("text-xs font-bold", config.ercValidationEnabled ? "text-[#14F195]" : "text-[#888]")}>{config.ercValidationEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
          <div className="col-span-2 text-[11px] text-[#888] [&_a]:text-[#888] [&_a:hover]:text-[#9945FF]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#666]">Authority Wallet</p>
            <div className="mt-0.5">
              <Address pubkey={pk(config.authority)} link raw />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
