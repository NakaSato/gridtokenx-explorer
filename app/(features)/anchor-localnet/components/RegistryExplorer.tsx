'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import {
  Database,
  RefreshCw,
  Plus,
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
  lastReading: number;
}

export function RegistryExplorer({ rpcUrl, getConnection }: RegistryExplorerProps) {
  const [registry, setRegistry] = useState<RegistryData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [meters, setMeters] = useState<MeterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'users' | 'meters'>('users');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.registry.id);
      const accounts = await conn.getProgramAccounts(programId);

      const userList: UserData[] = [];
      const meterList: MeterData[] = [];
      let registryData: RegistryData | null = null;

      for (const { pubkey, account } of accounts) {
        const data = account.data;

        // RegistryRecord (zero_copy, large)
        if (data.length > 500) {
          try {
            const d = data.slice(8);
            registryData = {
              address: pubkey.toBase58(),
              authority: new PublicKey(d.slice(0, 32)).toBase58(),
              userCount: Number(d.readBigUInt64LE(32)),
              meterCount: Number(d.readBigUInt64LE(40)),
              activeMeterCount: Number(d.readBigUInt64LE(48)),
            };
          } catch (err) {
            console.error('Error parsing registry record:', err);
          }
        }
        // UserRecord
        else if (data.length >= 64 && data.length < 128) {
          try {
            const d = data.slice(8);
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
        // MeterRecord
        else if (data.length >= 128 && data.length < 300) {
          try {
            const d = data.slice(8);
            const meterId = new TextDecoder().decode(d.slice(0, 32)).replace(/\0/g, '');
            const owner = new PublicKey(d.slice(32, 64)).toBase58();
            const meterTypeNum = d[64];
            const statusNum = d[65];
            const isActive = statusNum === 0; // MeterStatus::Active is 0
            const lastReading = Number(d.readBigUInt64LE(80));

            meterList.push({
              address: pubkey.toBase58(),
              meterId,
              owner,
              meterType: ENUM_MAPS.MeterType[meterTypeNum] || 'Solar',
              isActive,
              lastReading,
            });
          } catch (err) {
            console.error('Error parsing meter record:', err);
          }
        }
      }

      setRegistry(registryData);
      setUsers(userList);
      setMeters(meterList);
    } catch (err) {
      console.warn('RegistryExplorer fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-none">Registry Program</h3>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {PROGRAMS.registry.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => {}}
          >
            <Plus className="h-3.5 w-3.5" /> Register {activeView === 'users' ? 'User' : 'Meter'}
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchData}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      {registry && <RegistryStatsCard registry={registry} />}

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-[400px] grid-cols-2 h-9">
            <TabsTrigger value="users" className="text-xs">User Identities</TabsTrigger>
            <TabsTrigger value="meters" className="text-xs">Meter Topology</TabsTrigger>
          </TabsList>
          
          <Badge variant="outline" className="h-6 font-mono text-[10px]">
            {activeView === 'users' ? `${users.length} Identities` : `${meters.length} Nodes`}
          </Badge>
        </div>

        <TabsContent value="users" className="mt-0">
          <Card className="overflow-hidden border-border/60">
            <UsersTable users={users} />
          </Card>
        </TabsContent>

        <TabsContent value="meters" className="mt-0">
          <Card className="overflow-hidden border-border/60">
            <MetersTable meters={meters} />
          </Card>
        </TabsContent>
      </Tabs>

      <InstructionReference title="Registry Instruction Set" instructions={PROGRAMS.registry.instructions} />
    </div>
  );
}
