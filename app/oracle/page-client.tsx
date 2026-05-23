'use client';

import React, { Suspense } from 'react';
import { useCluster } from '@/app/(core)/providers/cluster';
import { Cluster } from '@/app/(shared)/utils/cluster';
import { useAnchorLocalnet } from '@/app/(features)/anchor-localnet/hooks/useAnchorLocalnet';
import { OracleExplorer } from '@/app/(features)/anchor-localnet/components/OracleExplorer';

export default function OraclePageClient() {
  const { cluster, url } = useCluster();
  const isLocalnet = cluster === Cluster.Localnet || cluster === Cluster.Custom;
  const { getConnection } = useAnchorLocalnet(url, isLocalnet);

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
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">Oracle Program</h1>
        <div className="w-full">
          <OracleExplorer
            rpcUrl={url}
            getConnection={getConnection}
          />
        </div>
      </div>
    </Suspense>
  );
}
