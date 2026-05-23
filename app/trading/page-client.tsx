'use client';

import React, { Suspense } from 'react';
import { useCluster } from '@/app/(core)/providers/cluster';
import { Cluster } from '@/app/(shared)/utils/cluster';
import { useAnchorLocalnet } from '@/app/(features)/anchor-localnet/hooks/useAnchorLocalnet';
import { TradingExplorer } from '@/app/(features)/anchor-localnet/components/TradingExplorer';

export default function TradingPageClient() {
  const { cluster, url } = useCluster();
  // We can default this to true if the trading program exists on devnet/mainnet,
  // but based on current implementation, it seems tailored for localnet.
  // We'll pass `true` to useAnchorLocalnet to try and fetch regardless of cluster,
  // or restrict it if needed. Let's use `isLocalnet` logic as in the dashboard.
  const isLocalnet = cluster === Cluster.Localnet || cluster === Cluster.Custom;
  const { getConnection, fetchProgramAccounts } = useAnchorLocalnet(url, isLocalnet);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto mt-4 px-4">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      }
    >
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">Trading Program</h1>
        <div className="w-full">
          <TradingExplorer
            rpcUrl={url}
            getConnection={getConnection}
            fetchProgramAccounts={fetchProgramAccounts}
          />
        </div>
      </div>
    </Suspense>
  );
}
