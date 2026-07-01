'use client';

import React from 'react';
import { ProgramPageLayout } from '@/app/(shared)/components/layout/ProgramPageLayout';
import { TreasuryExplorer } from '@/app/(features)/anchor-localnet';
import { Landmark, ShieldCheck } from 'lucide-react';

export default function TreasuryPage() {
  return (
    <ProgramPageLayout
      title="Treasury"
      description="THBG stablecoin reserve, GRX staking & rewards, and Merkle-committed batch settlement for the GridTokenX economy."
      icon={Landmark}
      iconColor="green"
      badgeText="Solana Program"
      badgeColor="green"
      secondaryLabel="Reserve Backing"
      secondaryValue="Attested On-Chain"
      secondaryIcon={ShieldCheck}
      secondaryColor="green"
      contentClassName="overflow-hidden p-0"
    >
      {({ rpcUrl, getConnection }) => (
        <TreasuryExplorer rpcUrl={rpcUrl} getConnection={getConnection} />
      )}
    </ProgramPageLayout>
  );
}
