'use client';

import React from 'react';
import { ProgramPageLayout } from '@/app/(shared)/components/layout/ProgramPageLayout';
import { OracleExplorer } from '@/app/(features)/anchor-localnet';
import { Radio, Server } from 'lucide-react';

export default function OraclePage() {
  return (
    <ProgramPageLayout
      title="Oracle Bridge"
      description="Real-time telemetry ingestion and cryptographic validation of smart meter data for grid settlement."
      icon={Radio}
      iconColor="orange"
      badgeText="IoT Telemetry"
      badgeColor="orange"
      secondaryLabel="Nodes Online"
      secondaryValue="Validator Active"
      secondaryIcon={Server}
      secondaryColor="orange"
    >
      {({ rpcUrl, getConnection }) => (
        <OracleExplorer rpcUrl={rpcUrl} getConnection={getConnection} />
      )}
    </ProgramPageLayout>
  );
}
