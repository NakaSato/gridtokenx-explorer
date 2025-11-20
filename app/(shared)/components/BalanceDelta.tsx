import { SolBalance } from '@/app/(shared)/components/SolBalance';
import { BigNumber } from 'bignumber.js';
import React from 'react';

export function BalanceDelta({ delta, isSol = false }: { delta: BigNumber; isSol?: boolean }) {
  let sols;

  if (isSol) {
    sols = <SolBalance lamports={Math.abs(delta.toNumber())} />;
  }

  if (delta.gt(0)) {
    return (
      <span className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
        +{isSol ? sols : delta.toString()}
      </span>
    );
  } else if (delta.lt(0)) {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
        {isSol ? <>-{sols}</> : delta.toString()}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-500 px-2 py-0.5 text-xs font-medium text-white">
      0
    </span>
  );
}
