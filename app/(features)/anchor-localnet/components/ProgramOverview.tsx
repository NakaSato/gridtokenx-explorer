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
import type { ProgramStatus } from '../hooks/useAnchorLocalnet';
import { PROGRAMS } from '../config';

interface ProgramOverviewProps {
  programs: ProgramStatus[];
  onSelectProgram: (name: string) => void;
}

const PROGRAM_ICONS: Record<string, string> = {
  'Trading': '⚡',
  'Energy Token': '🪙',
  'Governance': '🏛️',
  'Oracle': '📡',
  'Registry': '📋',
  'Blockbench': '🔬',
};

export function ProgramOverview({ programs, onSelectProgram }: ProgramOverviewProps) {
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
          return (
            <div
              key={prog.programId}
              className="group relative rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{PROGRAM_ICONS[prog.name] ?? '📦'}</span>
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
                {prog.deployed && prog.name !== 'Blockbench' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => onSelectProgram(prog.name)}
                  >
                    Explore <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
