'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import {
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import { cn } from '@/app/(shared)/utils/cn';
import { Card } from '@/app/(shared)/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/(shared)/components/ui/table';

// Refactored Sub-components
import { OracleStatsCard } from './oracle/OracleStatsCard';
import { InstructionReference } from './shared-explorer/InstructionReference';

interface OracleExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface OracleData {
  address: string;
  authority: string;
  totalAggregatedEnergy: number;
  lastReadingTime: number;
  updateInterval: number;
  isActive: boolean;
  securityLevel: number;
}

interface MeterStateData {
  address: string;
  meterId: string;
  produced: number;
  consumed: number;
  totalReadings: number;
  lastReading: number;
}

export function OracleExplorer({ rpcUrl, getConnection }: OracleExplorerProps) {
  const [oracle, setOracle] = useState<OracleData | null>(null);
  const [meters, setMeters] = useState<MeterStateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.oracle.id);
      const accounts = await conn.getProgramAccounts(programId);

      const meterList: MeterStateData[] = [];
      let oracleData: OracleData | null = null;

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        const d = data.slice(8);

        // OracleData (zero_copy) — total 176 bytes
        if (data.length === 176) {
          try {
            oracleData = {
              address: pubkey.toBase58(),
              authority: new PublicKey(d.slice(0, 32)).toBase58(),
              totalAggregatedEnergy: Number(d.readBigUInt64LE(136)), // total_global_energy_produced
              lastReadingTime: Number(d.readBigInt64LE(72)), // last_reading_timestamp
              updateInterval: d.readUInt16LE(160), // min_reading_interval
              isActive: d[164] === 1, // active
              securityLevel: d[166], // last_quality_score
            };
          } catch (err) {
            console.error('Error parsing oracle state:', err);
          }
        }
        // MeterState (Borsh) — total 102 bytes
        else if (data.length === 102) {
          const idLen = d[32];
          meterList.push({
            address: pubkey.toBase58(),
            meterId: d.slice(0, 32).toString('utf8').slice(0, idLen),
            produced: Number(d.readBigUInt64LE(34 + 4 + 8 + 8)), // total_energy_produced
            consumed: Number(d.readBigUInt64LE(34 + 4 + 8 + 8 + 8)), // total_energy_consumed
            totalReadings: Number(d.readBigUInt64LE(34 + 4 + 8 + 8 + 8 + 8 + 8)), // total_readings
            lastReading: Number(d.readBigInt64LE(34 + 4 + 8 + 8 + 8 + 8)), // last_reading_timestamp
          });
        }
      }

      setOracle(oracleData);
      setMeters(meterList.sort((a, b) => b.lastReading - a.lastReading));
    } catch (err) {
      console.warn('OracleExplorer fetch error:', err);
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
    <div className="space-y-6 pt-2">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/30">
            <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-none">Oracle Program</h3>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {PROGRAMS.oracle.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchData}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Oracle Stats Card */}
      {oracle && <OracleStatsCard oracle={oracle} />}

      {/* Meter States Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Meter Telemetry</h4>
          <Badge variant="outline" className="h-5 text-[9px] font-mono">{meters.length} Online</Badge>
        </div>
        <div className="rounded-xl border border-white/5 bg-navy-900/40 overflow-hidden">
          <Table>
            <TableHeader className="bg-navy-900/60">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase font-bold text-slate-500">Meter ID</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold text-slate-500">Total Produced</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold text-slate-500">Readings</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-bold text-slate-500">Last Telemetry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meters.map((m) => (
                <TableRow key={m.address} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-orange-400">{m.meterId}</TableCell>
                  <TableCell className="text-right text-xs font-bold text-white">{m.produced.toLocaleString()} kWh</TableCell>
                  <TableCell className="text-right text-xs text-slate-400 font-mono">{m.totalReadings}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {m.lastReading > 0 ? new Date(m.lastReading * 1000).toLocaleTimeString() : 'Never'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {meters.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500 text-xs">
                    No active meter telemetry found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <InstructionReference title="Oracle Instruction Set" instructions={PROGRAMS.oracle.instructions} />
    </div>
  );
}
