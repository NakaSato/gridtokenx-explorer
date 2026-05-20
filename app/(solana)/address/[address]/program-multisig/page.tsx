import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@/app/(shared)/utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import ProgramMultisigPageClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  return {
    description: `Multisig information for the upgrade authority of the program with address ${(await props.params).address} on Solana`,
    title: `Upgrade Authority Multisig | ${await getReadableTitleFromAddress(props)} | Solana`
  };
}

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
}>;

export default async function ProgramMultisigPage({ params }: Props) {
  const resolvedParams = await params;
  return <ProgramMultisigPageClient params={resolvedParams} />;
}
