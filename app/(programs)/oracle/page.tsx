'use client';

import React from 'react';
import { ProgramPageLayout } from '@/app/(shared)/components/layout/ProgramPageLayout';
import { OracleExplorer } from '@/app/(features)/anchor-localnet';
import { Radio } from 'lucide-react';

export default function OraclePage() {
  return (
    <ProgramPageLayout
      icon={Radio}
      iconColor="orange"
      contentClassName="overflow-hidden p-0"
    >
      {({ rpcUrl, getConnection }) => (
        <OracleExplorer rpcUrl={rpcUrl} getConnection={getConnection} />
      )}
    </ProgramPageLayout>
  );
}
