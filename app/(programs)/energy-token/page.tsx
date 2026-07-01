'use client';

import React from 'react';
import { ProgramPageLayout } from '@/app/(shared)/components/layout/ProgramPageLayout';
import { EnergyTokenExplorer } from '@/app/(features)/anchor-localnet';
import { Coins } from 'lucide-react';

export default function EnergyTokenPage() {
  return (
    <ProgramPageLayout
      icon={Coins}
      iconColor="yellow"
      badgeColor="yellow"
      contentClassName="overflow-hidden p-0"
    >
      {({ rpcUrl, getConnection }) => (
        <EnergyTokenExplorer rpcUrl={rpcUrl} getConnection={getConnection} />
      )}
    </ProgramPageLayout>
  );
}
