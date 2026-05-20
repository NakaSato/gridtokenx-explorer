import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@/app/(shared)/utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import TokenExtensionsEntriesPageClient, { Props } from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  return {
    description: `Token extensions information for address ${(await props.params).address} on Solana`,
    title: `Token Extensions | ${await getReadableTitleFromAddress(props)} | Solana`
  };
}

export default async function TokenExtensionsPage({ params }: Props) {
  const resolvedParams = await params;
  return <TokenExtensionsEntriesPageClient params={resolvedParams} />;
}
