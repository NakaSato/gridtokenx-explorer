'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import {
  decodeEnergyTokenInfo,
  decodeGenerationMintRecord,
  EnergyTokenInfoData,
  GenerationMintRecordData,
  GENERATION_MINT_RECORD_ACCOUNT_SIZE,
  GRX_DECIMALS,
  SETTLEMENT_WINDOW_MS,
  TOKEN_INFO_ACCOUNT_SIZE,
} from '../lib/energy-token-decoders';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/(shared)/components/ui/table';
import { Button } from '@/app/(shared)/components/ui/button';
import { Address } from '@/app/(shared)/components/Address';
import {
  Coins, Activity, Zap, ShieldCheck, Search, RefreshCw, Clock, Wifi, WifiOff, AlertTriangle,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
} from 'lucide-react';

const MAX_ROWS = 100; // cap rendered rows; full counts shown in the stats
const PAGE_SIZE = 15; // rows per page in the records table

type SortKey = 'meter' | 'amount' | 'window' | 'status';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'minted' | 'pending';

type TokenInfoData = EnergyTokenInfoData;
// GenerationMintRecord — the real on-chain proof of generation: one record per
// (meter, 15-min settlement window) recording the GRX minted for that window.
type GenRecord = GenerationMintRecordData;

interface EnergyTokenExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

const fmtGrx = (raw: number) => raw / 10 ** GRX_DECIMALS;

const WINDOW_DATE_FMT = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const WINDOW_TIME_FMT = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  timeZone: 'UTC',
});

// Compact two-line window cell: "09:45–10:00" over "Jul 5 · UTC". The full
// verbose timestamp ("5 Jul 2026 at 09:45:00 UTC") made the Window column the
// widest in the table for what is always a 15-minute bucket.
function WindowCell({ windowMs }: { windowMs: number }) {
  const start = new Date(windowMs);
  const end = new Date(windowMs + SETTLEMENT_WINDOW_MS);
  const title = `${WINDOW_DATE_FMT.format(start)} ${WINDOW_TIME_FMT.format(start)}–${WINDOW_TIME_FMT.format(end)} UTC (15-min settlement window)`;
  return (
    <div className="whitespace-nowrap" title={title}>
      <p className="text-xs text-[#888]">
        {WINDOW_TIME_FMT.format(start)}
        <span className="text-[#555]">–{WINDOW_TIME_FMT.format(end)}</span>
      </p>
      <p className="text-[9px] text-[#555]">
        {WINDOW_DATE_FMT.format(start)} · UTC
      </p>
    </div>
  );
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('window');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.energy_token.id);

      const [infoAccounts, genAccounts] = await Promise.all([
        conn.getProgramAccounts(programId, { filters: [{ dataSize: TOKEN_INFO_ACCOUNT_SIZE }] }),
        conn.getProgramAccounts(programId, { filters: [{ dataSize: GENERATION_MINT_RECORD_ACCOUNT_SIZE }] }),
      ]);

      const info: TokenInfoData | null = infoAccounts[0]
        ? decodeEnergyTokenInfo(infoAccounts[0].account.data, infoAccounts[0].pubkey.toBase58())
        : null;

      let mintedSum = 0;
      const recs: GenRecord[] = genAccounts.map(({ pubkey, account }) => {
        const rec = decodeGenerationMintRecord(account.data, pubkey.toBase58());
        mintedSum += rec.amount;
        return rec;
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

  // Search + status filter.
  const filtered = useMemo(
    () =>
      records.filter((m) => {
        if (!m.meterId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (statusFilter === 'minted') return m.minted;
        if (statusFilter === 'pending') return !m.minted;
        return true;
      }),
    [records, searchQuery, statusFilter],
  );

  // Sort the filtered set by the active column.
  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    const cmp: Record<SortKey, (a: GenRecord, b: GenRecord) => number> = {
      meter: (a, b) => a.meterId.localeCompare(b.meterId),
      amount: (a, b) => a.amount - b.amount,
      window: (a, b) => a.windowMs - b.windowMs,
      status: (a, b) => Number(a.minted) - Number(b.minted),
    };
    return [...filtered].sort((a, b) => cmp[sortKey](a, b) * dir);
  }, [filtered, sortKey, sortDir]);

  // Pagination — clamp the page whenever the result set shrinks.
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(
    () => sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [sorted, safePage],
  );

  // Reset to the first page whenever the view (search/filter/sort) changes.
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, sortKey, sortDir]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        // Same column → flip direction.
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prevKey;
      }
      // New column → sensible default direction (text asc, numbers/status desc).
      setSortDir(key === 'meter' ? 'asc' : 'desc');
      return key;
    });
  }, []);

  const rpcHost = useMemo(() => {
    try {
      return new URL(rpcUrl).host;
    } catch {
      return rpcUrl;
    }
  }, [rpcUrl]);

  if (isLoading && !tokenInfo && records.length === 0 && !error) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3 bg-black p-12 font-mono text-[#9945FF]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#9945FF] border-t-transparent" />
        <p className="text-xs uppercase tracking-widest">Connecting to {rpcHost}…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 bg-black p-2 font-mono text-[#e0e0e0]">
      {/* Header + connection status */}
      <div className="flex flex-col justify-between gap-3 border border-[#2a2a2a] bg-[#111] p-3 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#9945FF]/15">
            <Coins className="h-5 w-5 text-[#9945FF]" />
          </div>
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Energy Token Program</h2>
            <div className="mt-1 flex items-center gap-2">
              <code className="bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] tracking-wider text-[#14F195]">
                {PROGRAMS.energy_token.id.slice(0, 16)}...
              </code>
              {error ? (
                <span className="flex items-center bg-[#ff3333]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff5555]">
                  <WifiOff className="mr-1 h-2.5 w-2.5" /> RPC ERROR
                </span>
              ) : (
                <span className="flex items-center bg-[#14F195]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#14F195]">
                  <Wifi className="mr-1 h-2.5 w-2.5" /> LIVE
                </span>
              )}
              {lastUpdated && (
                <span className="text-[9px] text-[#666]">{new Date(lastUpdated).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="group relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#666] transition-colors group-focus-within:text-[#9945FF]" />
            <input
              type="text"
              placeholder="Search meter id..."
              className="w-full rounded-none border border-[#2a2a2a] bg-black py-2 pl-9 pr-4 text-xs text-[#e0e0e0] transition-all focus:border-[#9945FF] focus:outline-none md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-none border-[#2a2a2a] bg-[#0a0a0a] hover:bg-[#9945FF]/10" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 text-[#9945FF]" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 border border-[#ff3333]/40 bg-[#ff3333]/10 px-4 py-2 text-[10px] uppercase tracking-wide text-[#ff5555]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            RPC error: {error}. Validator expected at <span className="text-[#ff8c00]">{rpcHost}</span>.
          </span>
        </div>
      )}

      {/* Stats — all real, on-chain */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Coins className="h-5 w-5" />}
          label="Total GRX Supply"
          value={tokenInfo ? `${fmtGrx(tokenInfo.totalSupply).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '0'}
          subValue="Incl. Seed & Direct Mints"
          color="purple"
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
          color="purple"
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="REC Validators"
          value={tokenInfo ? tokenInfo.recValidatorsCount.toString() : '0'}
          subValue="Certification Authority"
          color="green"
        />
      </div>

      {/* Records table (full width) */}
      <div className="flex min-h-0 flex-1 flex-col">
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-[#2a2a2a] bg-black">
          <CardHeader className="shrink-0 border-b border-[#2a2a2a] bg-[#111] py-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Generation Mint Records</CardTitle>
                <p className="text-[9px] uppercase tracking-wide text-[#666]">
                  GRX minted per meter per settlement window
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Status filter */}
                <div className="flex border border-[#2a2a2a] bg-[#0a0a0a]">
                  {(['all', 'minted', 'pending'] as StatusFilter[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                        statusFilter === s
                          ? 'bg-[#9945FF]/20 text-[#9945FF]'
                          : 'text-[#666] hover:text-[#aaa]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <span className="border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] text-[#888]">
                  {totalRecords > MAX_ROWS
                    ? `${sorted.length} of ${totalRecords.toLocaleString()}`
                    : `${sorted.length} records`}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div className="min-h-0 flex-1 overflow-auto">
              <Table className="[&_td]:px-3 [&_th]:px-3 [&_tr>*:first-child]:pl-4 [&_tr>*:last-child]:pr-4">
                <TableHeader className="sticky top-0 z-10 bg-[#0a0a0a]">
                  <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                    <SortHeader label="Meter ID" col="meter" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="GRX Minted" col="amount" align="right" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="Window" col="window" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortHeader label="Status" col="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <TableHead className="text-right text-[9px] font-bold uppercase tracking-wider text-[#666]">Trace</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((rec) => (
                    <TableRow
                      key={rec.address}
                      className="group border-[#1a1a1a] transition-colors odd:bg-[#070707] hover:bg-[#9945FF]/5"
                    >
                      <TableCell className="py-2">
                        <p className="text-sm font-bold text-[#e0e0e0] transition-colors group-hover:text-[#9945FF]">
                          {rec.meterId}
                        </p>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="inline-flex items-center gap-1.5 border border-[#14F195]/20 bg-[#14F195]/10 px-2 py-1">
                          <Zap className="h-3 w-3 text-[#14F195]" />
                          <span className="text-sm font-bold text-[#14F195]">
                            {fmtGrx(rec.amount).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[9px] text-[#555]">{rec.amount.toLocaleString()} raw</p>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 shrink-0 text-[#555]" />
                          <WindowCell windowMs={rec.windowMs} />
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        {rec.minted ? (
                          <span className="bg-[#14F195]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#14F195]">Minted</span>
                        ) : (
                          <span className="bg-[#ff8c00]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#ff8c00]">Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-right text-xs">
                        <Address pubkey={new PublicKey(rec.address)} link alignRight />
                      </TableCell>
                    </TableRow>
                  ))}
                  {sorted.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-[#555]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Activity className="h-8 w-8 opacity-30" />
                          <p className="text-[10px] uppercase tracking-wide">
                            {searchQuery || statusFilter !== 'all'
                              ? 'No records match the current filter'
                              : 'No generation records on-chain yet'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination footer */}
            {sorted.length > 0 && (
              <div className="flex items-center justify-between border-t border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2">
                <span className="text-[9px] uppercase tracking-wider text-[#666]">
                  {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-none border-[#2a2a2a] bg-black hover:bg-[#9945FF]/10 disabled:opacity-30"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-[#9945FF]" />
                  </Button>
                  <span className="text-[9px] uppercase tracking-wider text-[#888]">
                    {safePage + 1} / {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-none border-[#2a2a2a] bg-black hover:bg-[#9945FF]/10 disabled:opacity-30"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={safePage >= pageCount - 1}
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-[#9945FF]" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
  align = 'left',
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sortKey === col;
  const Icon = !active ? ChevronsUpDown : sortDir === 'asc' ? ChevronUp : ChevronDown;
  return (
    <TableHead className={`text-[9px] font-bold uppercase tracking-wider text-[#666] ${align === 'right' ? 'text-right' : ''}`}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-[#9945FF] ${
          active ? 'text-[#9945FF]' : ''
        } ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {label}
        <Icon className={`h-3 w-3 ${active ? 'opacity-100' : 'opacity-40'}`} />
      </button>
    </TableHead>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  color = 'purple',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color?: string;
}) {
  const accent = color === 'green' ? '#14F195' : '#9945FF';

  return (
    <Card className="group overflow-hidden rounded-none border-[#2a2a2a] bg-black transition-colors hover:border-[#9945FF]/40">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="border border-[#2a2a2a] p-2" style={{ color: accent }}>
            {icon}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#666]">{label}</span>
        </div>
        <div>
          <p className="text-2xl font-black tracking-tighter text-[#e0e0e0]">{value}</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-tight text-[#555]">{subValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}
