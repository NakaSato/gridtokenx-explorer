'use client';

import React from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';

interface InstructionReferenceProps {
  title: string;
  instructions: string[];
}

export function InstructionReference({ title, instructions }: InstructionReferenceProps) {
  return (
    <div className="mt-4 rounded-xl border border-border/40 bg-muted/5 p-3">
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h4>
      <div className="flex flex-wrap gap-1.5">
        {instructions.map((ix) => (
          <Badge key={ix} variant="secondary" className="font-mono text-[9px] px-2 py-0.5 bg-background border border-border/40">
            {ix}
          </Badge>
        ))}
      </div>
    </div>
  );
}
