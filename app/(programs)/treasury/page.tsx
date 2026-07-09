'use client';

import React from 'react';
import { ProgramPageLayout } from '@/app/(shared)/components/layout/ProgramPageLayout';
import { TreasuryExplorer } from '@/app/(features)/anchor-localnet';
import { Landmark } from 'lucide-react';

export default function TreasuryPage() {
  return (
    <ProgramPageLayout
      icon={Landmark}
      iconColor="green"
      contentClassName="overflow-hidden p-0"
    >
      {({ rpcUrl, getConnection }) => (
        <TreasuryExplorer rpcUrl={rpcUrl} getConnection={getConnection} />
      )}
    </ProgramPageLayout>
  );
}
