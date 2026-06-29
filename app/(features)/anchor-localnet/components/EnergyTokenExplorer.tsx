'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/(shared)/components/ui/table';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Signature } from '@/app/(shared)/components/Signature';
import { TimestampToggle } from '@/app/(shared)/components/TimestampToggle';
import { Coins, Activity, Zap, ShieldCheck, Search, RefreshCw, Clock, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const GRX_DECIMALS = 9;
const TOKEN_INFO_SIZE = 320; // TokenInfo (zero-copy): 312 payload + 8 disc
const GEN_RECORD_SIZE = 42; // GenerationMintRecord: 34 payload + 8 disc
const MAX_ROWS = 100; // cap rendered rows; full counts shown in the stats

interface TokenInfoData {
  address: string;
  authority: string;
  registryProgram: string;
  mint: string;
  totalSupply: number;
  recValidatorsCount: number;
}

// GenerationMintRecord — the real on-chain proof of generation: one record per
// (meter, 15-min settlement window) recording the GRX minted for that window.
interface GenRecord {
  address: string;
  meterId: string;
  windowMs: number;
  amount: number;
  minted: boolean;
}

interface EnergyTokenExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

const fmtGrx = (raw: number) => raw / 10 ** GRX_DECIMALS;

function decodeMeterId(buf: Buffer): string {
  // meter_id is 16 bytes; the seeder stores an ASCII id. Fall back to hex.
  const ascii = buf.toString('ascii').replace(/[\x00\s]+$/g, ''); // trim trailing NUL/space padding
  return /^[\x20-\x7e]+$/.test(ascii) ? ascii : buf.toString('hex');
}

export function EnergyTokenExplorer({ rpcUrl, getConnection }: EnergyTokenExplorerProps) {
  const [tokenInfo, setTokenInfo] = useState<TokenInfoData | null>(null);
  const [records, setRecords] = useState<GenRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalMinted, setTotalMinted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.energy_token.id);

      const [infoAccounts, genAccounts] = await Promise.all([
        conn.getProgramAccounts(programId, { filters: [{ dataSize: TOKEN_INFO_SIZE }] }),
        conn.getProgramAccounts(programId, { filters: [{ dataSize: GEN_RECORD_SIZE }] }),
      ]);

      let info: TokenInfoData | null = null;
      if (infoAccounts[0]) {
        const d = infoAccounts[0].account.data.subarray(8) as Buffer;
        info = {
          address: infoAccounts[0].pubkey.toBase58(),
          authority: new PublicKey(d.subarray(0, 32)).toBase58(),
          registryProgram: new PublicKey(d.subarray(64, 96)).toBase58(),
          mint: new PublicKey(d.subarray(96, 128)).toBase58(),
          totalSupply: Number(d.readBigUInt64LE(128)),
          recValidatorsCount: d[304],
        };
      }

      let mintedSum = 0;
      const recs: GenRecord[] = genAccounts.map(({ pubkey, account }) => {
        const d = account.data.subarray(8) as Buffer;
        const amount = Number(d.readBigUInt64LE(24));
        mintedSum += amount;
        return {
          address: pubkey.toBase58(),
          meterId: decodeMeterId(d.subarray(0, 16) as Buffer),
          windowMs: Number(d.readBigInt64LE(16)),
          amount,
          minted: d[32] === 1,
        };
      });

      recs.sort((a, b) => b.windowMs - a.windowMs);
      setTokenInfo(info);
      setTotalRecords(recs.length);
      setTotalMinted(mintedSum);
      setRecords(recs.slice(0, MAX_ROWS));
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error('Error fetching energy token data:', err);
      setError(err instanceof Error ? err.message : 'Failed to reach RPC endpoint');
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = useMemo(
    () => records.filter((m) => m.meterId.toLowerCase().includes(searchQuery.toLowerCase())),
    [records, searchQuery],
  );

  const rpcHost = useMemo(() => {
    try {
      return new URL(rpcUrl).host;
    } catch {
      return rpcUrl;
    }
  }, [rpcUrl]);

  if (isLoading && !tokenInfo && records.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="animate-pulse font-medium text-slate-500">Connecting to {rpcHost}…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + connection status */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/5 bg-navy-900/40 p-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/20 shadow-lg shadow-yellow-500/5">
            <Coins className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight text-white">Energy Token Program</h2>
            <div className="mt-1 flex items-center gap-2">
              <code className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                {PROGRAMS.energy_token.id.slice(0, 16)}...
              </code>
              {error ? (
                <Badge className="h-4 border-red-500/20 bg-red-500/10 text-[9px] text-red-400">
                  <WifiOff className="mr-1 h-2.5 w-2.5" /> RPC ERROR
                </Badge>
              ) : (
                <Badge className="h-4 border-green-500/20 bg-green-500/10 text-[9px] text-green-400">
                  <Wifi className="mr-1 h-2.5 w-2.5" /> LIVE
                </Badge>
              )}
              {lastUpdated && (
                <span className="text-[10px] text-slate-500">{new Date(lastUpdated).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="group relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search meter id..."
              className="w-full rounded-lg border border-white/10 bg-navy-900/60 py-2 pl-9 pr-4 text-xs text-white transition-all focus:border-primary/50 focus:outline-none md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 border-white/10 hover:bg-white/5" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            RPC error: {error}. Ensure a validator is running at <span className="font-mono">{rpcHost}</span>.
          </span>
        </div>
      )}

      {/* Stats — all real, on-chain */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Coins className="h-5 w-5" />}
          label="Total GRX Supply"
          value={tokenInfo ? `${fmtGrx(tokenInfo.totalSupply).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '0'}
          subValue="On-chain Circulating"
          color="yellow"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Generation Records"
          value={totalRecords.toLocaleString()}
          subValue="Proof-of-Generation Mints"
          color="green"
        />
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label="Total Minted"
          value={`${fmtGrx(totalMinted).toLocaleString(undefined, { maximumFractionDigits: 2 })} GRX`}
          subValue="Across All Windows"
          color="primary"
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="REC Validators"
          value={tokenInfo ? tokenInfo.recValidatorsCount.toString() : '0'}
          subValue="Certification Authority"
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Records table */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden rounded-2xl border-white/5 bg-navy-800/20 shadow-xl backdrop-blur-md">
            <CardHeader className="border-b border-white/5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-white">Proof-of-Generation Records</CardTitle>
                  <p className="text-[11px] text-muted-foreground">
                    GRX minted per meter per settlement window
                  </p>
                </div>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px]">
                  {totalRecords > MAX_ROWS
                    ? `${filtered.length} of ${totalRecords.toLocaleString()}`
                    : `${filtered.length} records`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500">Meter ID</TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase text-slate-500">GRX Minted</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500">Window</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500">Status</TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase text-slate-500">Trace</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((rec) => (
                    <TableRow key={rec.address} className="group border-white/5 transition-colors hover:bg-white/5">
                      <TableCell className="py-4">
                        <p className="font-mono text-sm font-black text-white transition-colors group-hover:text-primary">
                          {rec.meterId}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500">PK: {rec.address.slice(0, 12)}...</p>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <div className="inline-flex items-center gap-1.5 rounded-md border border-green-500/10 bg-green-500/10 px-2 py-1">
                          <Zap className="h-3 w-3 text-green-400" />
                          <span className="text-sm font-black text-green-400">
                            {fmtGrx(rec.amount).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <TimestampToggle unixTimestamp={rec.windowMs} shorter />
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {rec.minted ? (
                          <Badge className="border-green-500/20 bg-green-500/10 text-[9px] text-green-400">Minted</Badge>
                        ) : (
                          <Badge className="border-amber-500/20 bg-amber-500/10 text-[9px] text-amber-400">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/20">
                          <Signature signature={rec.address} link />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Activity className="h-8 w-8 opacity-20" />
                          <p className="text-xs font-medium">
                            {searchQuery ? `No records matching "${searchQuery}"` : 'No generation records on-chain yet'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Config column */}
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border-white/5 bg-navy-800/20 shadow-xl backdrop-blur-md">
            <CardHeader className="border-b border-white/5 bg-white/5 py-4">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Program Config
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <InfoItem label="Mint Address" value={tokenInfo?.mint || '—'} copyable />
              <InfoItem label="Authority" value={tokenInfo?.authority || '—'} />
              <InfoItem label="Registry Link" value={tokenInfo?.registryProgram || '—'} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  color = 'primary',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    yellow: 'from-yellow-500/20 to-transparent text-yellow-500',
    green: 'from-green-500/20 to-transparent text-green-400',
    primary: 'from-primary/20 to-transparent text-primary',
    blue: 'from-blue-500/20 to-transparent text-blue-400',
  };

  return (
    <Card className="group overflow-hidden border-white/5 bg-navy-800/30 backdrop-blur-md transition-colors hover:bg-navy-800/50">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <div className={`rounded-xl border border-white/5 bg-gradient-to-br p-2 ${colorMap[color].split(' ')[0]}`}>
            <div className={colorMap[color].split(' ')[1]}>{icon}</div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
        </div>
        <div>
          <p className="text-2xl font-black tracking-tighter text-white">{value}</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-tight text-slate-500">{subValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <div className="group flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/20 p-2 transition-colors hover:border-primary/30">
        <p className="truncate font-mono text-[10px] text-slate-400">{value}</p>
        {copyable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => navigator.clipboard.writeText(value)}
          >
            <Coins className="h-3 w-3 text-primary" />
          </Button>
        )}
      </div>
    </div>
  );
}
