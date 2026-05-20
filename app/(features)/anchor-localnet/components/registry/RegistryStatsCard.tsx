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
    <Card className="border-border/60 bg-card/50 shadow-sm overflow-hidden">
      <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Registry Overview & Topology</h4>
        <div className="flex items-center gap-1.5">
          <Grid3X3 className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-[10px] font-mono text-muted-foreground">{registry.address.slice(0, 8)}...</span>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-md bg-blue-50 p-1.5 dark:bg-blue-900/20">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <StatItem label="Registered Users" value={registry.userCount} />
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-md bg-green-50 p-1.5 dark:bg-green-900/20">
              <Gauge className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <StatItem label="Total Meters" value={registry.meterCount} />
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-md bg-yellow-50 p-1.5 dark:bg-yellow-900/20">
              <MapPin className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <StatItem label="Active Nodes" value={registry.activeMeterCount} />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Authority</p>
            <p className="font-mono text-[10px] truncate w-32 mt-0.5">{registry.authority}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
