'use client';

import React from 'react';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { StatItem } from '../shared-explorer/Stats';
import { Grid3X3, Users, Gauge, MapPin } from 'lucide-react';
import { Address } from '@/app/(shared)/components/Address';

interface RegistryData {
  address: string;
  authority: string;
  userCount: number;
  meterCount: number;
  activeMeterCount: number;
}

/**
 * Actual counts derived from the fetched account lists. The global Registry
 * counters (`registry.userCount` etc.) are sharded — they stay 0 until someone
 * calls `aggregate_shards`, so they under-report. When present, these live
 * totals (which match the table badges exactly) take precedence.
 */
interface LiveCounts {
  users: number;
  meters: number;
  activeMeters: number;
}

interface RegistryStatsCardProps {
  registry: RegistryData;
  counts?: LiveCounts;
}

/** Plain pubkey-like wrapper so <Address> never constructs a web3.js PublicKey
 * (dodges the dual-package `instanceof` trap under Turbopack). */
const pk = (address: string) => ({ toBase58: () => address });

export function RegistryStatsCard({ registry, counts }: RegistryStatsCardProps) {
  const users = counts?.users ?? registry.userCount;
  const meters = counts?.meters ?? registry.meterCount;
  const activeMeters = counts?.activeMeters ?? registry.activeMeterCount;

  return (
    <Card className="rounded-none border-[#2a2a2a] bg-black overflow-hidden font-mono">
      <div className="bg-[#111] px-4 py-2 border-b border-[#2a2a2a] flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Registry Overview & Topology</h4>
        <div className="flex items-center gap-1.5 min-w-0">
          <Grid3X3 className="h-3.5 w-3.5 shrink-0 text-[#9945FF]" />
          <div className="truncate text-[10px] font-mono bg-[#0a0a0a] px-1.5 py-0.5 text-[#9945FF] hover:text-white">
            <Address pubkey={pk(registry.address)} link raw truncate />
          </div>
        </div>
      </div>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          <div className="flex items-start gap-2">
            <div className="mt-1 border border-[#2a2a2a] p-1.5">
              <Users className="h-4 w-4 text-[#9945FF]" />
            </div>
            <StatItem label="Registered Users" value={users} color="text-[#9945FF]" />
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 border border-[#2a2a2a] p-1.5">
              <Gauge className="h-4 w-4 text-[#14F195]" />
            </div>
            <StatItem label="Total Meters" value={meters} color="text-[#14F195]" />
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 border border-[#2a2a2a] p-1.5">
              <MapPin className="h-4 w-4 text-[#ff8c00]" />
            </div>
            <StatItem label="Active Nodes" value={activeMeters} color="text-[#14F195]" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <p className="text-[9px] font-bold text-[#666] uppercase tracking-wider">Authority</p>
            <div className="font-mono text-[10px] truncate mt-0.5 text-[#9945FF] hover:text-white">
              <Address pubkey={pk(registry.authority)} link raw truncate />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
