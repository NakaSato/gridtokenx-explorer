'use client';

import React from 'react';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { Progress } from '@/app/(shared)/components/ui/progress';
import { StatItem } from '../shared-explorer/Stats';
import { Activity, Shield, Clock } from 'lucide-react';

interface OracleData {
  address: string;
  authority: string;
  totalAggregatedEnergy: number;
  lastReadingTime: number;
  updateInterval: number;
  isActive: boolean;
  securityLevel: number;
}

interface OracleStatsCardProps {
  oracle: OracleData;
}

export function OracleStatsCard({ oracle }: OracleStatsCardProps) {
  const securityProgress = (oracle.securityLevel / 3) * 100;
  
  return (
    <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black font-mono">
      <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#111] px-3 py-2">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Oracle Program Status</h4>
        {oracle.isActive ? (
          <span className="bg-[#14F195]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#14F195]">LIVE</span>
        ) : (
          <span className="bg-[#ff3333]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff5555]">OFFLINE</span>
        )}
      </div>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 border border-[#2a2a2a] p-1.5">
              <Activity className="h-4 w-4 text-[#9945FF]" />
            </div>
            <StatItem label="Aggregated Volume" value={`${oracle.totalAggregatedEnergy.toLocaleString()} kWh`} color="text-[#e0e0e0]" />
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5 border border-[#2a2a2a] p-1.5">
              <Clock className="h-4 w-4 text-[#9945FF]" />
            </div>
            <StatItem label="Update Frequency" value={`${oracle.updateInterval}s`} color="text-[#e0e0e0]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#666]">
              <Shield className="h-3 w-3" /> Security Level
            </p>
            <Progress value={securityProgress} className="h-1.5 w-full bg-[#1a1a1a]" />
            <span className="text-[10px] font-bold text-[#14F195]">Level {oracle.securityLevel} (Encrypted)</span>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#666]">Authority</p>
            <p className="mt-0.5 w-32 truncate font-mono text-[10px] text-[#14F195]">{oracle.authority}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
