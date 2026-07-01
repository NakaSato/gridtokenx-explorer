'use client';

import React from 'react';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { StatItem } from '../shared-explorer/Stats';
import { Grid3X3, Users, Gauge, MapPin } from 'lucide-react';

interface RegistryData {
  address: string;
  authority: string;
  userCount: number;
  meterCount: number;
  activeMeterCount: number;
}

interface RegistryStatsCardProps {
  registry: RegistryData;
}

export function RegistryStatsCard({ registry }: RegistryStatsCardProps) {
  return (
    <Card className="rounded-none border-[#2a2a2a] bg-black overflow-hidden font-mono">
      <div className="bg-[#111] px-4 py-2 border-b border-[#2a2a2a] flex items-center justify-between">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Registry Overview & Topology</h4>
        <div className="flex items-center gap-1.5">
          <Grid3X3 className="h-3.5 w-3.5 text-[#9945FF]" />
          <span className="text-[10px] font-mono bg-[#0a0a0a] px-1.5 py-0.5 text-[#888]">{registry.address.slice(0, 8)}...</span>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          <div className="flex items-start gap-2">
            <div className="mt-1 border border-[#2a2a2a] p-1.5">
              <Users className="h-4 w-4 text-[#9945FF]" />
            </div>
            <StatItem label="Registered Users" value={registry.userCount} color="text-[#9945FF]" />
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 border border-[#2a2a2a] p-1.5">
              <Gauge className="h-4 w-4 text-[#14F195]" />
            </div>
            <StatItem label="Total Meters" value={registry.meterCount} color="text-[#14F195]" />
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 border border-[#2a2a2a] p-1.5">
              <MapPin className="h-4 w-4 text-[#ff8c00]" />
            </div>
            <StatItem label="Active Nodes" value={registry.activeMeterCount} color="text-[#14F195]" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[9px] font-bold text-[#666] uppercase tracking-wider">Authority</p>
            <p className="font-mono text-[10px] truncate w-32 mt-0.5 text-[#888]">{registry.authority}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
