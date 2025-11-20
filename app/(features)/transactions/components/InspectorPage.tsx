'use client';

import React from 'react';

interface InspectorPageProps {
  signature: string;
  showTokenBalanceChanges?: boolean;
}

export function TransactionInspectorPage({ signature, showTokenBalanceChanges = false }: InspectorPageProps) {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Transaction Inspector</h1>
      <p className="text-muted-foreground">Inspecting transaction: {signature}</p>
      <p className="text-muted-foreground mt-2 text-sm">
        Token balance changes: {showTokenBalanceChanges ? 'Enabled' : 'Disabled'}
      </p>
    </div>
  );
}
