import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@/app/(shared)/utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import SecurityPageClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  const { address } = await props.params;
  return {
    description: `Contents of the security.txt for the program with address ${address} on Solana`,
    title: `Security | ${await getReadableTitleFromAddress(props)} | Solana`,
  };
}

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
}>;

export default async function SecurityPage({ params }: Props) {
  const resolvedParams = await params;
  return <SecurityPageClient params={resolvedParams} />;
}
