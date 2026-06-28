import { BlockProvider } from '@/app/(core)/providers/block';
import { PropsWithChildren } from 'react';

export default function BlockLayout({ children }: PropsWithChildren<Record<string, never>>) {
  return <BlockProvider>{children}</BlockProvider>;
}
