'use client';

import React from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import {
  CheckCircle2,
  XCircle,
  Database,
  ArrowRight,
  Coins,
} from 'lucide-react';
import Link from 'next/link';
import type { ProgramStatus } from '../hooks/useAnchorLocalnet';
import { PROGRAMS } from '../config';

interface ProgramOverviewProps {
  programs: ProgramStatus[];
}

const PROGRAM_ICONS: Record<string, string> = {
  'Trading': '⚡',
  'Energy Token': '🪙',
  'Governance': '🏛️',
  'Oracle': '📡',
  'Registry': '📋',
  'Blockbench': '🔬',
};

const ROUTE_MAP: Record<string, string> = {
  'Trading': '/trading',
  'Energy Token': '/trading',
  'Governance': '/governance',
  'Oracle': '/oracle',
  'Registry': '/registry',
};

const PROGRAM_COLORS: Record<string, string> = {
  'Trading': 'from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-blue-500/20',
  'Energy Token': 'from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border-emerald-500/20',
  'Governance': 'from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20 border-orange-500/20',
  'Oracle': 'from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border-cyan-500/20',
  'Registry': 'from-slate-500/10 to-zinc-500/10 hover:from-slate-500/20 hover:to-zinc-500/20 border-slate-500/20',
  'Blockbench': 'from-gray-500/10 to-neutral-500/10 hover:from-gray-500/20 hover:to-neutral-500/20 border-gray-500/20',
};

export function ProgramOverview({ programs }: ProgramOverviewProps) {
  if (programs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Database className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          No program data available. Make sure localnet is running.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {programs.map((prog) => {
          const config = Object.values(PROGRAMS).find(p => p.id === prog.programId);
          const colorClass = PROGRAM_COLORS[prog.name] || 'from-muted to-muted/50 hover:from-muted/80 hover:to-muted border-border';
          const targetUrl = ROUTE_MAP[prog.name] ?? '/';
          return (
            <Link
              key={prog.programId}
              href={targetUrl}
              className={`block group relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${colorClass}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">{prog.name}</h4>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {prog.programId.slice(0, 8)}...{prog.programId.slice(-4)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={prog.deployed ? 'default' : 'secondary'}
                  className="text-[10px]"
                >
                  {prog.deployed ? (
                    <><CheckCircle2 className="mr-1 h-3 w-3" />Deployed</>
                  ) : (
                    <><XCircle className="mr-1 h-3 w-3" />Not Found</>
                  )}
                </Badge>
              </div>

              {config && (
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {config.description}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-3">
                  <span className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    {prog.accountCount} accounts
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="h-3 w-3" />
                    {(prog.lamports / 1e9).toFixed(3)} SOL
                  </span>
                </div>
              </div>

              {config && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {config.instructions.slice(0, 4).map((ix) => (
                    <Badge key={ix} variant="outline" className="text-[9px] font-mono">
                      {ix}
                    </Badge>
                  ))}
                  {config.instructions.length > 4 && (
                    <Badge variant="outline" className="text-[9px]">
                      +{config.instructions.length - 4} more
                    </Badge>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
