'use client';

import React from 'react';
import { ProgramPageLayout } from '@/app/(shared)/components/layout/ProgramPageLayout';
import { RegistryExplorer } from '@/app/(features)/anchor-localnet';
import { Database, MapPin } from 'lucide-react';

export default function RegistryPage() {
  return (
    <ProgramPageLayout
      icon={Database}
      iconColor="blue"
      badgeColor="blue"
    >
      {({ rpcUrl, getConnection }) => (
        <RegistryExplorer rpcUrl={rpcUrl} getConnection={getConnection} />
      )}
    </ProgramPageLayout>
  );
}
