'use client';

import React from 'react';
import { cn } from '@/app/(shared)/utils/cn';

interface StatItemProps {
  label: string;
  value: string | number;
  color?: string;
  className?: string;
}

export function StatItem({ label, value, color, className }: StatItemProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">{label}</p>
      <p className={cn("font-mono text-sm font-bold", color)}>{value}</p>
    </div>
  );
}

export function StatSmallCard({ label, value, color, className }: StatItemProps) {
  return (
    <div className={cn("rounded-lg border border-border/40 bg-background/50 p-2 shadow-sm", className)}>
      <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground truncate">{label}</p>
      <p className={cn("font-mono text-xs font-black mt-0.5", color)}>{value}</p>
    </div>
  );
}
