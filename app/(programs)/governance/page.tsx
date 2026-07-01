'use client';

import React from 'react';
import { ProgramPageLayout } from '@/app/(shared)/components/layout/ProgramPageLayout';
import { GovernanceExplorer } from '@/app/(features)/anchor-localnet';
import { Shield, Lock } from 'lucide-react';

export default function GovernancePage() {
  return (
    <ProgramPageLayout
      icon={Shield}
      iconColor="green"
      badgeColor="green"
      secondaryLabel="Security Level"
      secondaryValue="Institutional Grade"
      secondaryIcon={Lock}
      secondaryColor="green"
      contentClassName="overflow-hidden p-0"
    >
      {({ rpcUrl, getConnection }) => (
        <GovernanceExplorer rpcUrl={rpcUrl} getConnection={getConnection} />
      )}
    </ProgramPageLayout>
  );
}
