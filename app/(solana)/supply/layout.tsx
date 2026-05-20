import { RichListProvider } from '@/app/(core)/providers/richList';
import { SupplyProvider } from '@/app/(core)/providers/supply';
import { PropsWithChildren } from 'react';

export default function SupplyLayout({ children }: PropsWithChildren<Record<string, never>>) {
  return (
    <SupplyProvider>
      <RichListProvider>{children}</RichListProvider>
    </SupplyProvider>
  );
}
