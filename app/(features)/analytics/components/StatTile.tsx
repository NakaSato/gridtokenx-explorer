import React from 'react';
import { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/app/(shared)/components/ui/card';

export type StatAccent = 'primary' | 'green' | 'yellow' | 'blue' | 'slate';

const ACCENT: Record<StatAccent, { bg: string; fg: string }> = {
  primary: { bg: 'bg-primary/10', fg: 'text-primary' },
  green: { bg: 'bg-green-500/10', fg: 'text-green-500' },
  yellow: { bg: 'bg-yellow-500/10', fg: 'text-yellow-500' },
  blue: { bg: 'bg-blue-500/10', fg: 'text-blue-500' },
  slate: { bg: 'bg-slate-500/10', fg: 'text-slate-400' },
};

/**
 * Dashboard stat tile — icon chip + big value + label. Shared by the supply
 * page cards so SOL and GRX supply read the same. shadcn Card so it inherits
 * the app theme (light/dark) instead of the black-terminal energy explorer look.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  accent = 'primary',
  badge,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: StatAccent;
  badge?: React.ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <Card className="overflow-hidden transition-colors hover:border-primary/40">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <div className={`rounded-xl p-2 ${a.bg} ${a.fg}`}>
            <Icon className="h-5 w-5" />
          </div>
          {badge}
        </div>
        <div>
          <p className="truncate text-2xl font-bold tracking-tight" title={typeof value === 'string' ? value : undefined}>
            {value}
          </p>
          <p className="text-muted-foreground mt-1 text-[11px] font-semibold uppercase tracking-wider">{label}</p>
          {sub != null && <p className="text-muted-foreground/70 mt-0.5 text-xs">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
