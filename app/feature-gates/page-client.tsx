'use client';

import React, { Suspense } from 'react';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';

import FEATURES from '@/app/utils/feature-gate/featureGates.json';

import { Address } from '../components/common/Address';
import { useCluster } from '../providers/cluster';
import { Cluster, clusterSlug } from '../utils/cluster';
import { FeatureInfoType } from '../utils/feature-gate/types';

export default function FeatureGatesPageClient() {
  const { cluster } = useCluster();

  const clusterActivationEpoch = (feature: FeatureInfoType) => {
    switch (cluster) {
      case Cluster.MainnetBeta:
        return parseInt(String(feature.mainnet_activation_epoch ?? '0'));
      case Cluster.Devnet:
        return parseInt(String(feature.devnet_activation_epoch ?? '0'));
      case Cluster.Testnet:
        return parseInt(String(feature.testnet_activation_epoch ?? '0'));
      default:
        return 0;
    }
  };

  const filteredFeatures = (FEATURES as FeatureInfoType[])
    .map(feature => ({
      ...feature,
      clusterActivationEpoch: clusterActivationEpoch(feature),
    }))
    .filter((feature: FeatureInfoType & { clusterActivationEpoch: number }) => {
      return feature.clusterActivationEpoch > 0;
    })
    .sort((a, b) => {
      return (b.clusterActivationEpoch ?? 0) - (a.clusterActivationEpoch ?? 0);
    });

  return (
    <Suspense
      fallback={
        <div className="mx-4 mt-4">
          <div className="border-primary h-12 w-12 animate-spin rounded-full border-b-2" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      }
    >
      <div className="mx-4 mt-4">
        <h1>Feature Gates</h1>
        {cluster === Cluster.Custom ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800" role="alert">
            This is a custom cluster. Enumeration of feature gates is not available.
          </div>
        ) : (
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-3">Feature</th>
                    <th className="px-3">Activation</th>
                    <th className="px-3">SIMDs</th>
                    <th className="px-3">Description</th>
                    <th className="px-3">Key</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeatures.map(feature => (
                    <tr key={feature.key}>
                      <td className="px-3">{feature.title}</td>
                      <td className="px-3">
                        <Link
                          href={`/epoch/${feature.clusterActivationEpoch}?cluster=${clusterSlug(cluster)}`}
                          className="epoch-link mb-1"
                        >
                          {feature.clusterActivationEpoch}
                        </Link>
                      </td>
                      <td className="px-3">
                        {feature.simds[0] && feature.simd_link[0] && (
                          <a
                            href={feature.simd_link[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-primary text-primary hover:bg-primary rounded-md border px-3 py-1.5 text-sm hover:text-white"
                          >
                            {feature.simds.map(simd => simd.replace(/^0+/, ''))}
                          </a>
                        )}
                      </td>
                      <td className="px-3">{feature.description}</td>
                      <td className="px-3">
                        <Address pubkey={new PublicKey(feature.key)} link />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Suspense>
  );
}
