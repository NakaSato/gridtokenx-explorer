'use client';

import React, { Suspense } from 'react';
import { SupplyCard } from '@/app/(shared)/components/SupplyCard';
import { TopAccountsCard } from '@/app/(shared)/components/TopAccountsCard';
import { useCluster } from '@/app/(core)/providers/cluster';
import { Cluster } from '@/app/(shared)/utils/cluster';

export default function SupplyPageClient() {
  const cluster = useCluster();
  return (
    <Suspense
      fallback={
        <div className="container mt-4">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      }
    >
      <div className="container mt-4">
        <SupplyCard />
        {cluster.cluster === Cluster.Custom ? <TopAccountsCard /> : null}
      </div>
    </Suspense>
  );
}
