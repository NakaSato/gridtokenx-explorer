'use client';

import React, { Suspense } from 'react';
import { PieChart, Zap } from 'lucide-react';

import { SupplyCard } from '@/app/(features)/analytics/components/SupplyCard';
import { TopAccountsCard } from '@/app/(features)/analytics/components/TopAccountsCard';
import { EnergyTokenSupplyCard } from '@/app/(features)/analytics/components/EnergyTokenSupplyCard';
import { useCluster } from '@/app/(core)/providers/cluster';
import { Cluster } from '@/app/(shared)/utils/cluster';

function SectionHeading({ icon: Icon, title, hint }: { icon: typeof PieChart; title: string; hint: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="text-muted-foreground h-4 w-4" />
      <h2 className="text-sm font-semibold">{title}</h2>
      <span className="text-muted-foreground/70 text-xs">{hint}</span>
    </div>
  );
}

export default function SupplyPageClient() {
  const cluster = useCluster();
  const isCustom = cluster.cluster === Cluster.Custom;

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
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Supply</h1>
          <p className="text-muted-foreground text-sm">Native SOL and GridTokenX energy-token supply on this cluster.</p>
        </div>

        <section className="mb-8">
          <SectionHeading icon={PieChart} title="Native Supply" hint="SOL" />
          <SupplyCard />
        </section>

        {isCustom && (
          <section className="mb-8">
            <SectionHeading icon={Zap} title="Energy Token" hint="GRX · on-chain" />
            <EnergyTokenSupplyCard />
          </section>
        )}

        {isCustom && (
          <section>
            <SectionHeading icon={PieChart} title="Largest Accounts" hint="by SOL balance" />
            <TopAccountsCard />
          </section>
        )}
      </div>
    </Suspense>
  );
}
