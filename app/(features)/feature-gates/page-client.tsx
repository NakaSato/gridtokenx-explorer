'use client';

import React, { Suspense } from 'react';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';

import FEATURES from '@/app/(shared)/utils/feature-gate/featureGates.json';

import { Address } from '@/app/(shared)/components/common/Address';
import { useCluster } from '@/app/(core)/providers/cluster';
import { Cluster, clusterSlug } from '@/app/(shared)/utils/cluster';
import { FeatureInfoType } from '@/app/(shared)/utils/feature-gate/types';

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
        <div className="bg-black p-4 font-mono">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#9945FF] border-t-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      }
    >
      <div className="space-y-2 bg-black p-2 font-mono text-[#e0e0e0]">
        <div className="flex items-center justify-between border border-[#2a2a2a] bg-[#111] px-3 py-2">
          <h1 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Feature Gates</h1>
          <span className="bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#888]">
            {filteredFeatures.length} active
          </span>
        </div>
        {cluster === Cluster.Custom ? (
          <div className="border border-[#ff8c00]/40 bg-[#ff8c00]/10 px-4 py-3 text-[10px] uppercase tracking-wide text-[#ff8c00]" role="alert">
            This is a custom cluster. Enumeration of feature gates is not available.
          </div>
        ) : (
          <div className="border border-[#2a2a2a] bg-black">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-[#0a0a0a]">
                  <tr className="border-b border-[#2a2a2a] text-[9px] font-bold uppercase tracking-wider text-[#666]">
                    <th className="px-3 py-2 text-left">Feature</th>
                    <th className="px-3 py-2 text-left">Activation</th>
                    <th className="px-3 py-2 text-left">SIMDs</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-left">Key</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeatures.map(feature => (
                    <tr key={feature.key} className="border-b border-[#1a1a1a] transition-colors hover:bg-[#9945FF]/5">
                      <td className="px-3 py-2 font-bold text-[#e0e0e0]">{feature.title}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/epoch/${feature.clusterActivationEpoch}?cluster=${clusterSlug(cluster)}`}
                          className="text-[#14F195] hover:text-[#9945FF]"
                        >
                          {feature.clusterActivationEpoch}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        {feature.simds[0] && feature.simd_link[0] && (
                          <a
                            href={feature.simd_link[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-[#9945FF]/40 px-2 py-0.5 text-[10px] text-[#9945FF] transition-colors hover:bg-[#9945FF] hover:text-white"
                          >
                            {feature.simds.map(simd => simd.replace(/^0+/, ''))}
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[#888]">{feature.description}</td>
                      <td className="px-3 py-2">
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
