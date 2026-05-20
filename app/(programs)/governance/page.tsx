'use client';

import React from 'react';
import { ProgramPageLayout } from '@/app/(shared)/components/layout/ProgramPageLayout';
import { GovernanceExplorer } from '@/app/(features)/anchor-localnet';
import { Shield, Lock } from 'lucide-react';

export default function GovernancePage() {
  return (
    <ProgramPageLayout
      title="Governance"
      description="Proof-of-Authority management, REC certification, and system-wide parameter control for the GridTokenX ecosystem."
      icon={Shield}
      iconColor="green"
      badgeText="PoA Governance"
      badgeColor="green"
      secondaryLabel="Security Level"
      secondaryValue="Institutional Grade"
      secondaryIcon={Lock}
      secondaryColor="green"
    >
      {({ rpcUrl, getConnection }) => (
        <GovernanceExplorer rpcUrl={rpcUrl} getConnection={getConnection} />
      )}
    </ProgramPageLayout>
  );
}
