'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/(shared)/components/ui/tabs';
import {
  Landmark,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Inbox,
  Coins,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Users,
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import { cn } from '@/app/(shared)/utils/cn';
import { InstructionReference } from './shared-explorer/InstructionReference';

// Treasury token mints use 6 decimals (THBG_DECIMALS / GRX, state.rs).
const TOKEN_DECIMALS = 6;

interface TreasuryExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface TreasuryData {
  address: string;
  authority: string;
  attestor: string;
  grxMint: string;
  thbgMint: string;
  settlementRecorder: string;
  attestedReserve: number;
  attestationTs: number;
  attestationTtl: number;
  thbgSupply: number;
  grxPerThbgRate: number;
  totalStaked: number;
  rewardPool: number;
  createdAt: number;
  totalSettledThbg: number;
  swapFeeBps: number;
  paused: boolean;
}

interface StakePosition {
  address: string;
  owner: string;
  amount: number;
  pending: number;
}

interface SettlementShard {
  address: string;
  shardId: number;
  settledThbg: number;
  settlementCount: number;
}

interface SettlementRecord {
  address: string;
  merkleRoot: string;
  recorder: string;
  totalValue: number;
  vatAmount: number;
  committedTs: number;
  batchId: number;
  zoneId: number;
  vatRateBps: number;
}

// Account payload sizes (excluding the 8-byte Anchor discriminator).
const SIZE = { treasury: 256, stake: 65, shard: 24, settlement: 112 };

function pk(buf: Uint8Array, off: number): string {
  return new PublicKey(buf.slice(off, off + 32)).toBase58();
}

export function TreasuryExplorer({ rpcUrl, getConnection }: TreasuryExplorerProps) {
  const [treasury, setTreasury] = useState<TreasuryData | null>(null);
  const [stakes, setStakes] = useState<StakePosition[]>([]);
  const [shards, setShards] = useState<SettlementShard[]>([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.treasury.id);
      const accounts = await conn.getProgramAccounts(programId);

      let treasuryData: TreasuryData | null = null;
      const stakeList: StakePosition[] = [];
      const shardList: SettlementShard[] = [];
      const settlementList: SettlementRecord[] = [];

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        const d = data.slice(8);
        const addr = pubkey.toBase58();

        try {
          if (data.length === SIZE.treasury + 8) {
            treasuryData = {
              address: addr,
              authority: pk(d, 16),
              attestor: pk(d, 48),
              grxMint: pk(d, 80),
              thbgMint: pk(d, 112),
              settlementRecorder: pk(d, 144),
              attestedReserve: Number(d.readBigUInt64LE(176)),
              attestationTs: Number(d.readBigInt64LE(184)),
              attestationTtl: Number(d.readBigInt64LE(192)),
              thbgSupply: Number(d.readBigUInt64LE(200)),
              grxPerThbgRate: Number(d.readBigUInt64LE(208)),
              totalStaked: Number(d.readBigUInt64LE(216)),
              rewardPool: Number(d.readBigUInt64LE(224)),
              createdAt: Number(d.readBigInt64LE(232)),
              totalSettledThbg: Number(d.readBigUInt64LE(240)),
              swapFeeBps: d.readUInt16LE(248),
              paused: d[250] === 1,
            };
          } else if (data.length === SIZE.stake + 8) {
            stakeList.push({
              address: addr,
              owner: pk(d, 0),
              amount: Number(d.readBigUInt64LE(32)),
              pending: Number(d.readBigUInt64LE(56)),
            });
          } else if (data.length === SIZE.shard + 8) {
            shardList.push({
              address: addr,
              settledThbg: Number(d.readBigUInt64LE(0)),
              settlementCount: Number(d.readBigUInt64LE(8)),
              shardId: d[16],
            });
          } else if (data.length === SIZE.settlement + 8) {
            settlementList.push({
              address: addr,
              merkleRoot: Buffer.from(d.slice(0, 32)).toString('hex'),
              recorder: pk(d, 32),
              totalValue: Number(d.readBigUInt64LE(64)),
              vatAmount: Number(d.readBigUInt64LE(72)),
              committedTs: Number(d.readBigInt64LE(80)),
              batchId: Number(d.readBigUInt64LE(88)),
              zoneId: d.readUInt32LE(96),
              vatRateBps: d.readUInt16LE(100),
            });
          }
        } catch (e) {
          console.error('Treasury account decode error:', addr, e);
        }
      }

      setTreasury(treasuryData);
      setStakes(stakeList.sort((a, b) => b.amount - a.amount));
      setShards(shardList.sort((a, b) => a.shardId - b.shardId));
      setSettlements(settlementList.sort((a, b) => b.committedTs - a.committedTs));
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      console.warn('TreasuryExplorer fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reach RPC endpoint');
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const rpcHost = useMemo(() => {
    try {
      return new URL(rpcUrl).host;
    } catch {
      return rpcUrl;
    }
  }, [rpcUrl]);

  const attestationFresh = useMemo(() => {
    if (!treasury || treasury.attestationTs === 0) return null;
    const nowSec = Math.floor(Date.now() / 1000);
    return nowSec <= treasury.attestationTs + treasury.attestationTtl;
  }, [treasury]);

  const isConnected = !error;

  if (isLoading && !treasury && !error) {
    return (
      <div className="space-y-3 pt-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Connection status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/40 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">{rpcHost}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{PROGRAMS.treasury.id}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {lastUpdated && <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={fetchData}>
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            RPC error: {error}. Ensure a validator is running at{' '}
            <span className="font-mono">{rpcHost}</span> with the Treasury program deployed. Retrying…
          </span>
        </div>
      )}

      {!treasury && !error ? (
        <Card className="border-border/60 bg-card/40">
          <EmptyState label="Treasury not initialized on this cluster" icon={Landmark} />
        </Card>
      ) : (
        treasury && (
          <>
            {/* Reserve / stablecoin overview */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                icon={Coins}
                label="Attested Reserve"
                value={fmtToken(treasury.attestedReserve)}
                unit="THB"
                accent="green"
              />
              <StatCard
                icon={Coins}
                label="THBG Supply"
                value={fmtToken(treasury.thbgSupply)}
                unit="THBG"
                accent="blue"
              />
              <StatCard
                icon={Users}
                label="Total Staked"
                value={fmtToken(treasury.totalStaked)}
                unit="GRX"
                accent="indigo"
              />
              <StatCard
                icon={Layers}
                label="Reward Pool"
                value={fmtToken(treasury.rewardPool)}
                unit="GRX"
                accent="yellow"
              />
            </div>

            {/* Config card */}
            <Card className="border-border/60 bg-card/40 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                  <Landmark className="h-3.5 w-3.5 text-primary" /> Treasury Config
                </CardTitle>
                <div className="flex items-center gap-2">
                  {attestationFresh !== null &&
                    (attestationFresh ? (
                      <Badge variant="outline" className="gap-1 border-green-200 bg-green-50 text-[9px] text-green-600">
                        <ShieldCheck className="h-3 w-3" /> Attestation Fresh
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-[9px] text-amber-600">
                        <ShieldAlert className="h-3 w-3" /> Attestation Stale
                      </Badge>
                    ))}
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px]',
                      treasury.paused
                        ? 'border-red-200 bg-red-50 text-red-600'
                        : 'border-green-200 bg-green-50 text-green-600',
                    )}
                  >
                    {treasury.paused ? 'Paused' : 'Active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-x-8 gap-y-2 p-4 sm:grid-cols-2">
                <Row label="Swap Fee" value={`${(treasury.swapFeeBps / 100).toFixed(2)} %`} />
                <Row label="GRX per THBG Rate" value={treasury.grxPerThbgRate.toLocaleString()} />
                <Row label="Total Settled" value={`${fmtToken(treasury.totalSettledThbg)} THBG`} />
                <Row
                  label="Attestation TTL"
                  value={treasury.attestationTtl > 0 ? `${treasury.attestationTtl}s` : '—'}
                />
                <Row
                  label="Last Attested"
                  value={
                    treasury.attestationTs > 0
                      ? new Date(treasury.attestationTs * 1000).toLocaleString()
                      : '—'
                  }
                />
                <Row
                  label="Created"
                  value={treasury.createdAt > 0 ? new Date(treasury.createdAt * 1000).toLocaleString() : '—'}
                />
                <Row label="Authority" value={treasury.authority} mono truncate />
                <Row label="Attestor" value={treasury.attestor} mono truncate />
                <Row label="THBG Mint" value={treasury.thbgMint} mono truncate />
                <Row label="Settlement Recorder" value={treasury.settlementRecorder} mono truncate />
              </CardContent>
            </Card>

            {/* Tables */}
            <Tabs defaultValue="stakes" className="w-full">
              <TabsList className="grid h-9 w-full grid-cols-3 sm:w-[480px]">
                <TabsTrigger value="stakes" className="text-xs">
                  Stake Positions ({stakes.length})
                </TabsTrigger>
                <TabsTrigger value="settlements" className="text-xs">
                  Settlements ({settlements.length})
                </TabsTrigger>
                <TabsTrigger value="shards" className="text-xs">
                  Shards ({shards.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stakes" className="mt-4">
                <Card className="overflow-hidden border-border/60">
                  {stakes.length === 0 ? (
                    <EmptyState label="No stake positions" />
                  ) : (
                    <DataTable
                      head={['Owner', 'Staked (GRX)', 'Pending Rewards (GRX)']}
                      rows={stakes.map((s) => [
                        <span key="o" className="font-mono text-[10px]">{shorten(s.owner)}</span>,
                        fmtToken(s.amount),
                        fmtToken(s.pending),
                      ])}
                    />
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="settlements" className="mt-4">
                <Card className="overflow-hidden border-border/60">
                  {settlements.length === 0 ? (
                    <EmptyState label="No settlement records" />
                  ) : (
                    <DataTable
                      head={['Batch', 'Zone', 'Total (THBG)', 'VAT', 'Committed', 'Merkle Root']}
                      rows={settlements.map((s) => [
                        s.batchId.toLocaleString(),
                        s.zoneId.toLocaleString(),
                        fmtToken(s.totalValue),
                        `${fmtToken(s.vatAmount)} (${(s.vatRateBps / 100).toFixed(1)}%)`,
                        new Date(s.committedTs * 1000).toLocaleString(),
                        <span key="m" className="font-mono text-[10px]">{s.merkleRoot.slice(0, 12)}…</span>,
                      ])}
                    />
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="shards" className="mt-4">
                <Card className="overflow-hidden border-border/60">
                  {shards.length === 0 ? (
                    <EmptyState label="No settlement shards initialized" />
                  ) : (
                    <DataTable
                      head={['Shard', 'Settled (THBG)', 'Settlement Count']}
                      rows={shards.map((s) => [
                        `#${s.shardId}`,
                        fmtToken(s.settledThbg),
                        s.settlementCount.toLocaleString(),
                      ])}
                    />
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )
      )}

      <InstructionReference title="Treasury Instruction Set" instructions={PROGRAMS.treasury.instructions} />
    </div>
  );
}

function fmtToken(raw: number): string {
  return (raw / 10 ** TOKEN_DECIMALS).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function shorten(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

const ACCENTS: Record<string, string> = {
  green: 'text-green-500',
  blue: 'text-blue-500',
  indigo: 'text-indigo-500',
  yellow: 'text-yellow-500',
};

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <Card className="border-border/60 bg-card/40 backdrop-blur-md">
      <CardContent className="p-4">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Icon className={cn('h-3.5 w-3.5', ACCENTS[accent])} />
          {label}
        </div>
        <p className="font-mono text-lg font-black leading-none">
          {value} <span className="text-xs font-bold text-muted-foreground">{unit}</span>
        </p>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/20 py-1.5 text-xs last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={cn('text-right', mono && 'font-mono text-[11px]', truncate && 'truncate')} title={value}>
        {value}
      </span>
    </div>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-muted/20 text-[9px] uppercase text-muted-foreground">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={cn('px-4 py-2 font-bold', i > 0 && 'text-right')}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[11px]">
          {rows.map((cells, r) => (
            <tr key={r} className="border-b border-border/20 transition-colors hover:bg-muted/10">
              {cells.map((c, i) => (
                <td key={i} className={cn('px-4 py-2 font-mono', i > 0 && 'text-right font-bold')}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ label, icon: Icon = Inbox }: { label: string; icon?: React.ElementType }) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
      <Icon className="h-6 w-6 opacity-40" />
      <p className="text-[11px] font-medium">{label}</p>
    </div>
  );
}
