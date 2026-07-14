'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/app/(shared)/components/ui/button';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import {
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import { readU64LE, readI64LE, readI32LE, readU16LE, bytesToAscii } from '../lib/bytes';
import { cn } from '@/app/(shared)/utils/cn';
import { Card } from '@/app/(shared)/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/(shared)/components/ui/table';

// Refactored Sub-components
import { OracleStatsCard } from './oracle/OracleStatsCard';
import { InstructionReference } from './shared-explorer/InstructionReference';
import { TablePagination } from './registry/TablePagination';

const PAGE_SIZE = 10;

interface OracleExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface OracleData {
  address: string;
  authority: string;
  chainBridge: string;
  totalReadings: number;
  totalValidReadings: number;
  totalRejectedReadings: number;
  totalGlobalEnergyProduced: number;
  totalGlobalEnergyConsumed: number;
  minEnergyValue: number;
  maxEnergyValue: number;
  lastReadingTime: number;
  lastClearing: number;
  createdAt: number;
  qualityScoreUpdatedAt: number;
  lastClearedEpoch: number;
  updateInterval: number;
  maxProductionConsumptionRatio: number;
  isActive: boolean;
  anomalyDetectionEnabled: boolean;
  securityLevel: number;
}

interface MeterStateData {
  address: string;
  meterId: string;
  bump: number;
  zoneId: number;
  energyProduced: number;
  energyConsumed: number;
  produced: number;
  consumed: number;
  totalReadings: number;
  lastReading: number;
  createdAt: number;
}

export function OracleExplorer({ rpcUrl, getConnection }: OracleExplorerProps) {
  const [oracle, setOracle] = useState<OracleData | null>(null);
  const [meters, setMeters] = useState<MeterStateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meterPage, setMeterPage] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.oracle.id);
      const accounts = await conn.getProgramAccounts(programId);

      const meterList: MeterStateData[] = [];
      let oracleData: OracleData | null = null;

      for (const { pubkey, account } of accounts) {
        // account.data reaches the browser as Uint8Array (no Buffer readBig* methods);
        // decode via lib/bytes DataView readers so it works in every realm.
        const data = account.data as Uint8Array;
        const d = data.slice(8); // strip 8-byte Anchor discriminator

        // OracleData (zero_copy) — total 176 bytes (8 disc + 168 struct)
        if (data.length === 176) {
          try {
            oracleData = {
              address: pubkey.toBase58(),
              authority: new PublicKey(d.slice(0, 32)).toBase58(), // offset 0
              chainBridge: new PublicKey(d.slice(32, 64)).toBase58(), // offset 32
              totalReadings: Number(readU64LE(d, 64)),
              lastReadingTime: Number(readI64LE(d, 72)), // last_reading_timestamp
              lastClearing: Number(readI64LE(d, 80)),
              createdAt: Number(readI64LE(d, 88)),
              minEnergyValue: Number(readU64LE(d, 96)),
              maxEnergyValue: Number(readU64LE(d, 104)),
              totalValidReadings: Number(readU64LE(d, 112)),
              totalRejectedReadings: Number(readU64LE(d, 120)),
              qualityScoreUpdatedAt: Number(readI64LE(d, 128)),
              totalGlobalEnergyProduced: Number(readU64LE(d, 136)),
              totalGlobalEnergyConsumed: Number(readU64LE(d, 144)),
              lastClearedEpoch: Number(readI64LE(d, 152)),
              updateInterval: readU16LE(d, 160), // min_reading_interval
              maxProductionConsumptionRatio: readU16LE(d, 162),
              isActive: d[164] === 1, // active
              anomalyDetectionEnabled: d[165] === 1,
              securityLevel: d[166], // last_quality_score
            };
          } catch (err) {
            console.error('Error parsing oracle state:', err);
          }
        }
        // MeterState (Borsh) — total 102 bytes (8 disc + 94 struct)
        else if (data.length === 102) {
          const idLen = d[32]; // meter_id_len
          meterList.push({
            address: pubkey.toBase58(),
            meterId: bytesToAscii(d.slice(0, 32)).slice(0, idLen),
            bump: d[33],
            zoneId: readI32LE(d, 34),
            energyProduced: Number(readU64LE(d, 38)), // latest reading
            energyConsumed: Number(readU64LE(d, 46)), // latest reading
            produced: Number(readU64LE(d, 54)), // total_energy_produced
            consumed: Number(readU64LE(d, 62)), // total_energy_consumed
            lastReading: Number(readI64LE(d, 70)), // last_reading_timestamp
            totalReadings: Number(readU64LE(d, 78)), // total_readings
            createdAt: Number(readI64LE(d, 86)),
          });
        }
      }

      setOracle(oracleData);
      setMeters(meterList.sort((a, b) => b.lastReading - a.lastReading));
      setMeterPage(0);
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
      <div className="space-y-2 bg-black p-2 font-mono">
        <Skeleton className="h-24 w-full rounded-none bg-[#111]" />
        <Skeleton className="h-48 w-full rounded-none bg-[#111]" />
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-black p-2 font-mono text-[#e0e0e0]">
      {/* Header */}
      <div className="mb-0 flex flex-col justify-between gap-3 border border-[#2a2a2a] bg-[#111] p-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#9945FF]/15">
            <Activity className="h-5 w-5 text-[#9945FF]" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Oracle Program</h3>
            <code className="mt-1 inline-block bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] tracking-wider text-[#14F195]">
              {PROGRAMS.oracle.id.slice(0, 16)}...
            </code>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-none border-[#2a2a2a] bg-[#0a0a0a] hover:bg-[#9945FF]/10" onClick={fetchData}>
            <RefreshCw className={cn("h-4 w-4 text-[#9945FF]", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Oracle Stats Card */}
      {oracle && <OracleStatsCard oracle={oracle} />}

      {/* Meter States Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Active Meter Telemetry</h4>
          <span className="border border-[#2a2a2a] bg-[#14F195]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#14F195]">{meters.length} Online</span>
        </div>
        <div className="overflow-hidden border border-[#2a2a2a] bg-black">
          <Table>
            <TableHeader className="bg-[#0a0a0a]">
              <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                <TableHead className="text-[9px] font-bold uppercase tracking-wider text-[#666]">Meter ID</TableHead>
                <TableHead className="text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Zone</TableHead>
                <TableHead className="text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Latest P / C</TableHead>
                <TableHead className="text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Total Produced</TableHead>
                <TableHead className="text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Total Consumed</TableHead>
                <TableHead className="text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Readings</TableHead>
                <TableHead className="text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Last Telemetry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meters.slice(meterPage * PAGE_SIZE, meterPage * PAGE_SIZE + PAGE_SIZE).map((m) => (
                <TableRow key={m.address} className="border-[#1a1a1a] transition-colors hover:bg-[#9945FF]/5">
                  <TableCell className="font-mono text-xs font-bold text-[#9945FF]">{m.meterId}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-[#888]">{m.zoneId}</TableCell>
                  <TableCell className="text-right font-mono text-[10px] text-[#888]">
                    {m.energyProduced.toLocaleString()} / {m.energyConsumed.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-[#14F195]">{m.produced.toLocaleString()} kWh</TableCell>
                  <TableCell className="text-right text-xs font-bold text-[#e0e0e0]">{m.consumed.toLocaleString()} kWh</TableCell>
                  <TableCell className="text-right font-mono text-xs text-[#888]">{m.totalReadings}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-[10px] font-medium text-[#666]">
                      {m.lastReading > 0 ? new Date(m.lastReading * 1000).toLocaleTimeString() : 'Never'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {meters.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-xs text-[#555]">
                    No active meter telemetry found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {meters.length > PAGE_SIZE && (
            <TablePagination
              page={meterPage}
              pageSize={PAGE_SIZE}
              totalItems={meters.length}
              onPageChange={setMeterPage}
            />
          )}
        </div>
      </div>

      <InstructionReference title="Oracle Instruction Set" instructions={PROGRAMS.oracle.instructions} />
    </div>
  );
}
