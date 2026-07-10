'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/(shared)/components/ui/button';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import {
  Database,
  RefreshCw,
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS, ENUM_MAPS } from '../config';
import { cn } from '@/app/(shared)/utils/cn';
import { Card } from '@/app/(shared)/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/(shared)/components/ui/tabs';

// Refactored Sub-components
import { RegistryStatsCard } from './registry/RegistryStatsCard';
import { UsersTable } from './registry/UsersTable';
import { MetersTable } from './registry/MetersTable';
import { TablePagination } from './registry/TablePagination';
import { InstructionReference } from './shared-explorer/InstructionReference';

interface RegistryExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface RegistryData {
  address: string;
  authority: string;
  userCount: number;
  meterCount: number;
  activeMeterCount: number;
}

interface UserData {
  address: string;
  wallet: string;
  userType: string;
  isRegistered: boolean;
  meterCount: number;
}

interface MeterData {
  address: string;
  meterId: string;
  owner: string;
  meterType: string;
  isActive: boolean;
  lastReadingAt: number;
  totalGeneration: number;
}

// Rows rendered per page. The full decoded lists live in state; pagination
// only ever mounts one page of rows so a busy registry (tens of thousands of
// accounts) never floods the DOM.
const PAGE_SIZE = 25;

export function RegistryExplorer({ rpcUrl, getConnection }: RegistryExplorerProps) {
  const [registry, setRegistry] = useState<RegistryData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [meters, setMeters] = useState<MeterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'users' | 'meters'>('users');
  const [userPage, setUserPage] = useState(0);
  const [meterPage, setMeterPage] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.registry.id);
      // Fetch per account type with dataSize filters instead of one unfiltered
      // getProgramAccounts — a busy registry holds tens of thousands of
      // UserAccounts, and pulling every account unfiltered downloads megabytes
      // and freezes the page on skeletons.
      const [registryAccounts, userAccounts, meterAccounts] = await Promise.all([
        conn.getProgramAccounts(programId, { filters: [{ dataSize: 136 }] }), // Registry (zero_copy)
        conn.getProgramAccounts(programId, { filters: [{ dataSize: 112 }] }), // UserAccount (zero_copy)
        conn.getProgramAccounts(programId, { filters: [{ dataSize: 128 }] }), // MeterAccount (zero_copy)
      ]);

      let registryData: RegistryData | null = null;
      if (registryAccounts[0]) {
        try {
          const { pubkey, account } = registryAccounts[0];
          const d = account.data.slice(8);
          registryData = {
            address: pubkey.toBase58(),
            authority: new PublicKey(d.slice(0, 32)).toBase58(),
            userCount: Number(d.readBigUInt64LE(72)),
            meterCount: Number(d.readBigUInt64LE(80)),
            activeMeterCount: Number(d.readBigUInt64LE(88)),
          };
        } catch (err) {
          console.error('Error parsing registry record:', err);
        }
      }

      const userList: UserData[] = [];
      for (const { pubkey, account } of userAccounts) {
        try {
          const d = account.data.slice(8);
          const wallet = new PublicKey(d.slice(0, 32)).toBase58();
          const userTypeNum = d[32];
          const statusNum = d[56];
          const isRegistered = statusNum === 0; // UserStatus::Active is 0
          const meterCount = d.readUInt32LE(72);

          userList.push({
            address: pubkey.toBase58(),
            wallet,
            userType: ENUM_MAPS.UserType[userTypeNum] || 'Prosumer',
            isRegistered,
            meterCount,
          });
        } catch (err) {
          console.error('Error parsing user record:', err);
        }
      }

      const meterList: MeterData[] = [];
      for (const { pubkey, account } of meterAccounts) {
        try {
          const d = account.data.slice(8);
          const meterId = new TextDecoder().decode(d.slice(0, 32)).replace(/\0/g, '');
          const owner = new PublicKey(d.slice(32, 64)).toBase58();
          const meterTypeNum = d[64];
          const statusNum = d[65];
          const isActive = statusNum === 0; // MeterStatus::Active is 0
          // Layout (state.rs MeterAccount): last_reading_at i64 @80 is a unix
          // timestamp; total_generation u64 @88 is cumulative energy.
          const lastReadingAt = Number(d.readBigInt64LE(80));
          const totalGeneration = Number(d.readBigUInt64LE(88));

          meterList.push({
            address: pubkey.toBase58(),
            meterId,
            owner,
            meterType: ENUM_MAPS.MeterType[meterTypeNum] || 'Solar',
            isActive,
            lastReadingAt,
            totalGeneration,
          });
        } catch (err) {
          console.error('Error parsing meter record:', err);
        }
      }

      setRegistry(registryData);
      // Keep the full lists; pagination renders one PAGE_SIZE window at a time.
      setUsers(userList);
      setMeters(meterList);
      setUserPage(0);
      setMeterPage(0);
    } catch (err) {
      console.warn('RegistryExplorer fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live counts derived from the fetched lists (authoritative — the global
  // Registry counters are sharded and read 0 until aggregate_shards runs).
  const activeMeterCount = meters.reduce((n, m) => n + (m.isActive ? 1 : 0), 0);
  const pagedUsers = users.slice(userPage * PAGE_SIZE, userPage * PAGE_SIZE + PAGE_SIZE);
  const pagedMeters = meters.slice(meterPage * PAGE_SIZE, meterPage * PAGE_SIZE + PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="space-y-2 bg-black p-2 font-mono">
        <Skeleton className="h-24 w-full rounded-none bg-[#111]" />
        <Skeleton className="h-48 w-full rounded-none bg-[#111]" />
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-black p-2 font-mono text-[#e0e0e0]">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 border border-[#2a2a2a] bg-[#111] p-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#9945FF]/15">
            <Database className="h-5 w-5 text-[#9945FF]" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF] leading-none">Registry Program</h3>
            <p className="mt-1 font-mono text-[9px] tracking-wider text-[#666]">
              {PROGRAMS.registry.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-none border-[#2a2a2a] bg-[#0a0a0a] hover:bg-[#9945FF]/10" onClick={fetchData}>
            <RefreshCw className={cn("h-4 w-4 text-[#9945FF]", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      {registry && (
        <RegistryStatsCard
          registry={registry}
          counts={{ users: users.length, meters: meters.length, activeMeters: activeMeterCount }}
        />
      )}

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="grid w-[400px] grid-cols-2 h-9 rounded-none border border-[#2a2a2a] bg-[#0a0a0a] p-0">
            <TabsTrigger value="users" className="rounded-none text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">User Identities</TabsTrigger>
            <TabsTrigger value="meters" className="rounded-none text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">Meter Topology</TabsTrigger>
          </TabsList>

          <span className="border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#888]">
            {activeView === 'users' ? `${users.length} Identities` : `${meters.length} Nodes`}
          </span>
        </div>

        <TabsContent value="users" className="mt-0">
          <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black">
            <UsersTable users={pagedUsers} />
            <TablePagination
              page={userPage}
              pageSize={PAGE_SIZE}
              totalItems={users.length}
              onPageChange={setUserPage}
            />
          </Card>
        </TabsContent>

        <TabsContent value="meters" className="mt-0">
          <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black">
            <MetersTable meters={pagedMeters} />
            <TablePagination
              page={meterPage}
              pageSize={PAGE_SIZE}
              totalItems={meters.length}
              onPageChange={setMeterPage}
            />
          </Card>
        </TabsContent>
      </Tabs>

      <InstructionReference title="Registry Instruction Set" instructions={PROGRAMS.registry.instructions} />
    </div>
  );
}
