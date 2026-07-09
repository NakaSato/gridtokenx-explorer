'use client';

import React from 'react';
import Link from 'next/link';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  ArrowUpRight,
  Boxes,
  Users,
  Gauge,
  Store,
  ListOrdered,
  ArrowLeftRight,
  Radio,
  ShieldCheck,
  Landmark,
  Coins,
  Database,
} from 'lucide-react';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { useCluster } from '@/app/(core)/providers/cluster';
import { PROGRAMS } from '@/app/(features)/anchor-localnet/config';

/** Route to each program's explorer page. */
const PROGRAM_ROUTES: Record<string, string> = {
  trading: '/trading',
  energy_token: '/energy-token',
  governance: '/governance',
  oracle: '/oracle',
  registry: '/registry',
  treasury: '/treasury',
};

const PROGRAM_KEYS = Object.keys(PROGRAM_ROUTES) as (keyof typeof PROGRAMS)[];

/** Headline metrics surfaced as dashboard KPI tiles (program + Anchor account type). */
const KPIS: { label: string; program: keyof typeof PROGRAMS; type: string; icon: React.ReactNode }[] = [
  { label: 'Users', program: 'registry', type: 'UserAccount', icon: <Users className="h-4 w-4" /> },
  { label: 'Meters', program: 'registry', type: 'MeterAccount', icon: <Gauge className="h-4 w-4" /> },
  { label: 'Markets', program: 'trading', type: 'Market', icon: <Store className="h-4 w-4" /> },
  { label: 'Orders', program: 'trading', type: 'Order', icon: <ListOrdered className="h-4 w-4" /> },
  { label: 'Trades', program: 'trading', type: 'TradeRecord', icon: <ArrowLeftRight className="h-4 w-4" /> },
  { label: 'Oracle Feeds', program: 'oracle', type: 'OracleData', icon: <Radio className="h-4 w-4" /> },
  { label: 'ERC Certs', program: 'governance', type: 'ErcCertificate', icon: <ShieldCheck className="h-4 w-4" /> },
  { label: 'Settlements', program: 'treasury', type: 'SettlementRecord', icon: <Landmark className="h-4 w-4" /> },
  { label: 'Stakes', program: 'treasury', type: 'StakePosition', icon: <Coins className="h-4 w-4" /> },
];

type Counts = Record<string, Record<string, number>>; // programKey -> accountType -> count

function abbr(id: string) {
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

/**
 * Anchor account discriminator = first 8 bytes of sha256("account:<Name>"), as hex.
 * Sync noble hash — works in any context (network/http), unlike crypto.subtle which
 * is undefined outside a secure context and would leave the dashboard stuck loading.
 */
function discriminatorHex(name: string): string {
  const data = new TextEncoder().encode(`account:${name}`);
  return bytesToHex(sha256(data).slice(0, 8));
}

export function GridTokenXOverview() {
  const { url } = useCluster();
  const [counts, setCounts] = React.useState<Counts>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!url || (!url.startsWith('http:') && !url.startsWith('https:'))) return;
    const conn = new Connection(url, 'confirmed');
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      // Precompute discriminator → account-type map per program (sync).
      const discByProgram: Record<string, Map<string, string>> = {};
      for (const key of PROGRAM_KEYS) {
        const map = new Map<string, string>();
        for (const type of PROGRAMS[key].accounts) {
          map.set(discriminatorHex(type), type);
        }
        discByProgram[key] = map;
      }

      try {
        const results = await Promise.all(
          PROGRAM_KEYS.map(async key => {
            const p = PROGRAMS[key];
            const typeCounts: Record<string, number> = {};
            p.accounts.forEach(a => (typeCounts[a] = 0));
            try {
              // One call per program: pull the 8-byte discriminator of every account, tally client-side.
              const accs = await conn.getProgramAccounts(new PublicKey(p.id), {
                dataSlice: { offset: 0, length: 8 },
              });
              const discMap = discByProgram[key];
              for (const { account } of accs) {
                const hex = Buffer.from(account.data).toString('hex');
                const type = discMap.get(hex);
                if (type) typeCounts[type] += 1;
              }
            } catch {
              // program not deployed on this cluster → leave zeros
            }
            return [key, typeCounts] as const;
          })
        );
        if (!cancelled) setCounts(Object.fromEntries(results));
      } finally {
        // Always clear loading — otherwise a thrown error leaves the dashboard on skeletons forever.
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [url]);

  const get = (program: string, type: string) => counts[program]?.[type];
  const totalFor = (program: string) =>
    Object.values(counts[program] ?? {}).reduce((a, b) => a + b, 0);
  const grandTotal = PROGRAM_KEYS.reduce((sum, k) => sum + totalFor(k), 0);
  const programsLive = PROGRAM_KEYS.filter(k => totalFor(k) > 0).length;

  const fmt = (n: number | undefined) => {
    if (loading && n === undefined) return null; // skeleton
    return (n ?? 0).toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-cyan-400" />
          <h2 className="text-base font-bold text-foreground sm:text-lg md:text-xl">GridTokenX Dashboard</h2>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          live · updates 30s
        </span>
      </div>

      {/* Headline KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiTile
          label="On-chain Accounts"
          value={fmt(grandTotal)}
          icon={<Database className="h-4 w-4" />}
          highlight
        />
        <KpiTile
          label="Programs Live"
          value={`${programsLive}/${PROGRAM_KEYS.length}`}
          icon={<Boxes className="h-4 w-4" />}
          highlight
        />
        {KPIS.map(kpi => (
          <KpiTile key={kpi.label} label={kpi.label} value={fmt(get(kpi.program, kpi.type))} icon={kpi.icon} />
        ))}
      </div>

      {/* Per-program breakdown */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROGRAM_KEYS.map(key => {
          const p = PROGRAMS[key];
          const total = totalFor(key);
          return (
            <div
              key={key}
              className="group rounded-xl border border-border/50 bg-card/30 p-4 transition-colors hover:border-cyan-500/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={PROGRAM_ROUTES[key]}
                    className="flex items-center gap-1 font-bold text-foreground transition-colors hover:text-cyan-400"
                  >
                    {p.name}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                  <Link
                    href={`/address/${p.id}`}
                    className="mt-0.5 block font-mono text-xs text-muted-foreground transition-colors hover:text-cyan-400"
                    title={p.id}
                  >
                    {abbr(p.id)}
                  </Link>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xl font-black text-cyan-400">
                    {loading && counts[key] === undefined ? (
                      <span className="inline-block h-5 w-8 animate-pulse rounded bg-secondary" />
                    ) : (
                      total.toLocaleString()
                    )}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">accounts</div>
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                {p.accounts.map(type => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{type}</span>
                    <span className="font-mono font-semibold text-foreground">
                      {loading && counts[key] === undefined ? '…' : (get(key, type) ?? 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface KpiTileProps {
  label: string;
  value: string | null;
  icon: React.ReactNode;
  highlight?: boolean;
}

function KpiTile({ label, value, icon, highlight }: KpiTileProps) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        highlight
          ? 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50'
          : 'border-border/50 bg-card/30 hover:border-cyan-500/30'
      }`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-cyan-400">{icon}</span>
        <span className="truncate text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-mono text-2xl font-black text-cyan-400">
        {value === null ? <span className="inline-block h-6 w-10 animate-pulse rounded bg-secondary" /> : value}
      </div>
    </div>
  );
}

export default GridTokenXOverview;
