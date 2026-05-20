import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@/app/(shared)/utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import VoteHistoryPageClient from './page-client';

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  return {
    description: `Vote history of the address ${(await props.params).address} by slot on Solana`,
    title: `Vote History | ${await getReadableTitleFromAddress(props)} | Solana`
  };
}

export default async function VoteHistoryPage({ params }: Props) {
  const resolvedParams = await params;
  return <VoteHistoryPageClient params={resolvedParams} />;
}
