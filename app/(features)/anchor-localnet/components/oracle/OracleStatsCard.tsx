'use client';

import React from 'react';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
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
    <Card className="border-border/60 bg-card/50 shadow-sm overflow-hidden">
      <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Oracle Program Status</h4>
        <Badge variant={oracle.isActive ? 'default' : 'destructive'} className="h-5 text-[9px] px-2">
          {oracle.isActive ? 'LIVE' : 'OFFLINE'}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-md bg-blue-50 p-1.5 dark:bg-blue-900/20">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <StatItem label="Aggregated Volume" value={`${oracle.totalAggregatedEnergy.toLocaleString()} kWh`} />
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-md bg-orange-50 p-1.5 dark:bg-orange-900/20">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <StatItem label="Update Frequency" value={`${oracle.updateInterval}s`} />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight flex items-center gap-1">
              <Shield className="h-3 w-3" /> Security Level
            </p>
            <Progress value={securityProgress} className="h-1.5 w-full bg-muted" />
            <span className="text-[10px] font-bold">Level {oracle.securityLevel} (Encrypted)</span>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Authority</p>
            <p className="font-mono text-[10px] truncate w-32 mt-0.5">{oracle.authority}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
