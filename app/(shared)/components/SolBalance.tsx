import { lamportsToSolString } from '@/app/(shared)/utils';
import React from 'react';

export function SolBalance({
  lamports,
  maximumFractionDigits = 9,
}: {
  lamports: number | bigint;
  maximumFractionDigits?: number;
}) {
  return (
    <span>
      ◎<span className="font-mono">{lamportsToSolString(lamports, maximumFractionDigits)}</span>
    </span>
  );
}
