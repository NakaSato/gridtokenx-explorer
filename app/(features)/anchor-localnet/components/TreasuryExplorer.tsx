'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
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
import { readU64LE, readI64LE, readU32LE, readU16LE, bytesToHex } from '../lib/bytes';
import { cn } from '@/app/(shared)/utils/cn';
import { InstructionReference } from './shared-explorer/InstructionReference';

// Treasury token mints use 6 decimals (THBG_DECIMALS / GRX, state.rs).
const TOKEN_DECIMALS = 6;
// acc_reward_per_share is scaled by ACC_PRECISION = 1e12 (state.rs).
const ACC_PRECISION = 1e12;

interface TreasuryExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface TreasuryData {
  address: string;
  accRewardPerShare: bigint;
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
  bump: number;
  thbgMintBump: number;
  swapVaultBump: number;
  stakeVaultBump: number;
  rewardVaultBump: number;
  rebateVaultBump: number;
}

interface StakePosition {
  address: string;
  owner: string;
  amount: number;
  rewardDebt: number;
  pending: number;
  bump: number;
}

interface SettlementShard {
  address: string;
  shardId: number;
  settledThbg: number;
  settlementCount: number;
  bump: number;
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
  bump: number;
}

// Account payload sizes (excluding the 8-byte Anchor discriminator).
const SIZE = { treasury: 272, stake: 65, shard: 24, settlement: 112 };

function pk(buf: Uint8Array, off: number): string {
  return new PublicKey(buf.slice(off, off + 32)).toBase58();
}

// Read a little-endian u128 as bigint over raw account bytes (Uint8Array).
function u128(buf: Uint8Array, off: number): bigint {
  return readU64LE(buf, off) + (readU64LE(buf, off + 8) << 64n);
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
        // account.data reaches the browser as Uint8Array (no Buffer readBig* methods);
        // decode via lib/bytes DataView readers so it works in every realm.
        const data = account.data as Uint8Array;
        const d = data.slice(8);
        const addr = pubkey.toBase58();

        try {
          if (data.length === SIZE.treasury + 8) {
            treasuryData = {
              address: addr,
              accRewardPerShare: u128(d, 0),
              authority: pk(d, 16),
              attestor: pk(d, 48),
              grxMint: pk(d, 80),
              thbgMint: pk(d, 112),
              settlementRecorder: pk(d, 144),
              attestedReserve: Number(readU64LE(d, 176)),
              attestationTs: Number(readI64LE(d, 184)),
              attestationTtl: Number(readI64LE(d, 192)),
              thbgSupply: Number(readU64LE(d, 200)),
              grxPerThbgRate: Number(readU64LE(d, 208)),
              totalStaked: Number(readU64LE(d, 216)),
              rewardPool: Number(readU64LE(d, 224)),
              createdAt: Number(readI64LE(d, 232)),
              totalSettledThbg: Number(readU64LE(d, 240)),
              swapFeeBps: readU16LE(d, 248),
              paused: d[250] === 1,
              bump: d[251],
              thbgMintBump: d[252],
              swapVaultBump: d[253],
              stakeVaultBump: d[254],
              rewardVaultBump: d[255],
              rebateVaultBump: d[256],
            };
          } else if (data.length === SIZE.stake + 8) {
            stakeList.push({
              address: addr,
              owner: pk(d, 0),
              amount: Number(readU64LE(d, 32)),
              rewardDebt: Number(u128(d, 40)),
              pending: Number(readU64LE(d, 56)),
              bump: d[64],
            });
          } else if (data.length === SIZE.shard + 8) {
            shardList.push({
              address: addr,
              settledThbg: Number(readU64LE(d, 0)),
              settlementCount: Number(readU64LE(d, 8)),
              shardId: d[16],
              bump: d[17],
            });
          } else if (data.length === SIZE.settlement + 8) {
            settlementList.push({
              address: addr,
              merkleRoot: bytesToHex(d.slice(0, 32)),
              recorder: pk(d, 32),
              totalValue: Number(readU64LE(d, 64)),
              vatAmount: Number(readU64LE(d, 72)),
              committedTs: Number(readI64LE(d, 80)),
              batchId: Number(readU64LE(d, 88)),
              zoneId: readU32LE(d, 96),
              vatRateBps: readU16LE(d, 100),
              bump: d[102],
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
      <div className="space-y-2 bg-black p-2 font-mono">
        <Skeleton className="h-10 w-full rounded-none bg-[#111]" />
        <Skeleton className="h-32 w-full rounded-none bg-[#111]" />
        <Skeleton className="h-48 w-full rounded-none bg-[#111]" />
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-black p-2 font-mono text-[#e0e0e0]">
      {/* Connection status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border border-[#2a2a2a] bg-[#111] px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="flex items-center bg-[#14F195]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#14F195]">
                <Wifi className="mr-1 h-2.5 w-2.5" /> Live
              </span>
            ) : (
              <span className="flex items-center bg-[#ff3333]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff5555]">
                <WifiOff className="mr-1 h-2.5 w-2.5" /> Disconnected
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#888]">{rpcHost}</span>
          <code className="bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] tracking-wider text-[#14F195]">{PROGRAMS.treasury.id}</code>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#666]">
          {lastUpdated && <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
          <Button variant="outline" size="icon" className="h-7 w-7 rounded-none border-[#2a2a2a] bg-[#0a0a0a] hover:bg-[#9945FF]/10" onClick={fetchData}>
            <RefreshCw className={cn('h-3.5 w-3.5 text-[#9945FF]', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 border border-[#ff3333]/40 bg-[#ff3333]/10 px-4 py-2 text-[10px] uppercase tracking-wide text-[#ff5555]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            RPC error: {error}. Ensure a validator is running at{' '}
            <span className="text-[#ff8c00]">{rpcHost}</span> with the Treasury program deployed. Retrying…
          </span>
        </div>
      )}

      {!treasury && !error ? (
        <Card className="rounded-none border-[#2a2a2a] bg-black">
          <EmptyState label="Treasury not initialized on this cluster" icon={Landmark} />
        </Card>
      ) : (
        treasury && (
          <>
            {/* Reserve / stablecoin overview */}
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
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
                accent="purple"
              />
              <StatCard
                icon={Users}
                label="Total Staked"
                value={fmtToken(treasury.totalStaked)}
                unit="GRX"
                accent="green"
              />
              <StatCard
                icon={Layers}
                label="Reward Pool"
                value={fmtToken(treasury.rewardPool)}
                unit="GRX"
                accent="green"
              />
            </div>

            {/* Config card */}
            <Card className="rounded-none border-[#2a2a2a] bg-black">
              <CardHeader className="flex flex-row items-center justify-between border-b border-[#2a2a2a] bg-[#111] px-4 py-2">
                <CardTitle className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">
                  <Landmark className="h-3.5 w-3.5" /> Treasury Config
                </CardTitle>
                <div className="flex items-center gap-2">
                  {attestationFresh !== null &&
                    (attestationFresh ? (
                      <span className="flex items-center gap-1 bg-[#14F195]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#14F195]">
                        <ShieldCheck className="h-3 w-3" /> Attestation Fresh
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-[#ff8c00]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff8c00]">
                        <ShieldAlert className="h-3 w-3" /> Attestation Stale
                      </span>
                    ))}
                  <span
                    className={cn(
                      'px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                      treasury.paused
                        ? 'bg-[#ff3333]/15 text-[#ff5555]'
                        : 'bg-[#14F195]/15 text-[#14F195]',
                    )}
                  >
                    {treasury.paused ? 'Paused' : 'Active'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-x-8 gap-y-1 p-4 sm:grid-cols-2">
                <Row label="Swap Fee" value={`${(treasury.swapFeeBps / 100).toFixed(2)} %`} />
                <Row label="GRX per THBG Rate" value={treasury.grxPerThbgRate.toLocaleString()} />
                <Row
                  label="Acc Reward / Share"
                  value={(Number(treasury.accRewardPerShare) / ACC_PRECISION).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                />
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
                <Row label="Treasury PDA" value={treasury.address} mono truncate />
                <Row label="Authority" value={treasury.authority} mono truncate />
                <Row label="Attestor" value={treasury.attestor} mono truncate />
                <Row label="GRX Mint" value={treasury.grxMint} mono truncate />
                <Row label="THBG Mint" value={treasury.thbgMint} mono truncate />
                <Row label="Settlement Recorder" value={treasury.settlementRecorder} mono truncate />
                <Row
                  label="PDA Bumps"
                  value={`treasury ${treasury.bump} · thbg-mint ${treasury.thbgMintBump} · swap ${treasury.swapVaultBump} · stake ${treasury.stakeVaultBump} · reward ${treasury.rewardVaultBump} · rebate ${treasury.rebateVaultBump}`}
                  mono
                  truncate
                />
              </CardContent>
            </Card>

            {/* Tables */}
            <Tabs defaultValue="stakes" className="w-full">
              <TabsList className="grid h-9 w-full grid-cols-3 rounded-none border border-[#2a2a2a] bg-[#0a0a0a] p-0 sm:w-[480px]">
                <TabsTrigger value="stakes" className="rounded-none text-[10px] font-bold uppercase tracking-wider text-[#666] data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
                  Stake Positions ({stakes.length})
                </TabsTrigger>
                <TabsTrigger value="settlements" className="rounded-none text-[10px] font-bold uppercase tracking-wider text-[#666] data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
                  Settlements ({settlements.length})
                </TabsTrigger>
                <TabsTrigger value="shards" className="rounded-none text-[10px] font-bold uppercase tracking-wider text-[#666] data-[state=active]:bg-[#9945FF] data-[state=active]:text-white">
                  Shards ({shards.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stakes" className="mt-2">
                <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black">
                  {stakes.length === 0 ? (
                    <EmptyState label="No stake positions" />
                  ) : (
                    <DataTable
                      head={['Owner', 'Staked (GRX)', 'Reward Debt (GRX)', 'Pending Rewards (GRX)', 'Bump']}
                      rows={stakes.map((s) => [
                        <span key="o" className="bg-[#0a0a0a] px-1.5 py-0.5 font-mono text-[10px] text-[#14F195]" title={s.owner}>{shorten(s.owner)}</span>,
                        fmtToken(s.amount),
                        fmtToken(s.rewardDebt),
                        fmtToken(s.pending),
                        s.bump,
                      ])}
                    />
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="settlements" className="mt-2">
                <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black">
                  {settlements.length === 0 ? (
                    <EmptyState label="No settlement records" />
                  ) : (
                    <DataTable
                      head={['Batch', 'Zone', 'Total (THBG)', 'VAT', 'Recorder', 'Committed', 'Bump', 'Merkle Root']}
                      rows={settlements.map((s) => [
                        s.batchId.toLocaleString(),
                        s.zoneId.toLocaleString(),
                        fmtToken(s.totalValue),
                        `${fmtToken(s.vatAmount)} (${(s.vatRateBps / 100).toFixed(1)}%)`,
                        <span key="r" className="bg-[#0a0a0a] px-1.5 py-0.5 font-mono text-[10px] text-[#14F195]" title={s.recorder}>{shorten(s.recorder)}</span>,
                        new Date(s.committedTs * 1000).toLocaleString(),
                        s.bump,
                        <span key="m" className="bg-[#0a0a0a] px-1.5 py-0.5 font-mono text-[10px] text-[#14F195]" title={s.merkleRoot}>{s.merkleRoot.slice(0, 12)}…</span>,
                      ])}
                    />
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="shards" className="mt-2">
                <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black">
                  {shards.length === 0 ? (
                    <EmptyState label="No settlement shards initialized" />
                  ) : (
                    <DataTable
                      head={['Shard', 'Settled (THBG)', 'Settlement Count', 'Bump']}
                      rows={shards.map((s) => [
                        `#${s.shardId}`,
                        fmtToken(s.settledThbg),
                        s.settlementCount.toLocaleString(),
                        s.bump,
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
  green: '#14F195',
  purple: '#9945FF',
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
  const color = ACCENTS[accent] ?? '#9945FF';
  return (
    <Card className="rounded-none border-[#2a2a2a] bg-black transition-colors hover:border-[#9945FF]/40">
      <CardContent className="p-4">
        <div className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[#666]">
          <Icon className="h-3.5 w-3.5" style={{ color }} />
          {label}
        </div>
        <p className="font-mono text-2xl font-black leading-none tracking-tighter" style={{ color }}>
          {value} <span className="text-xs font-bold text-[#666]">{unit}</span>
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
    <div className="flex items-center justify-between gap-4 border-b border-[#1a1a1a] py-1.5 text-xs last:border-0">
      <span className="shrink-0 text-[10px] uppercase tracking-wider text-[#666]">{label}</span>
      <span
        className={cn('text-right text-[#e0e0e0]', mono && 'font-mono text-[11px] text-[#14F195]', truncate && 'truncate')}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-[#0a0a0a] text-[9px] font-bold uppercase tracking-wider text-[#666]">
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
            <tr key={r} className="border-b border-[#1a1a1a] transition-colors hover:bg-[#9945FF]/5">
              {cells.map((c, i) => (
                <td key={i} className={cn('px-4 py-2 font-mono text-[#e0e0e0]', i > 0 && 'text-right font-bold')}>
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
    <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 p-6 text-center text-[#555]">
      <Icon className="h-6 w-6 opacity-40" />
      <p className="text-[10px] font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
}
