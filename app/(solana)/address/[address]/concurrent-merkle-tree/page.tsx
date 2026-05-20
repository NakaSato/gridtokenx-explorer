import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@/app/(shared)/utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import ConcurrentMerkleTreePageClient from './page-client';

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  return {
    description: `Contents of the SPL Concurrent Merkle Tree at address ${(await props.params).address} on Solana`,
    title: `Concurrent Merkle Tree | ${await getReadableTitleFromAddress(props)} | Solana`
  };
}

export default async function ConcurrentMerkleTreePage({ params }: Props) {
  const resolvedParams = await params;
  return <ConcurrentMerkleTreePageClient params={resolvedParams} />;
}
