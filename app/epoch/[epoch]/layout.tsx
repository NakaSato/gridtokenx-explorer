import { EpochProvider } from '@/app/(core)/providers/epoch';
import { PropsWithChildren } from 'react';

export default function EpochLayout({ children }: PropsWithChildren<Record<string, never>>) {
  return <EpochProvider>{children}</EpochProvider>;
}
