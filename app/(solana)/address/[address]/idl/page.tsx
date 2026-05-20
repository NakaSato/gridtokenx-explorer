import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@/app/(shared)/utils/get-readable-title-from-address';
import { Metadata } from 'next/types';
import { ComponentProps } from 'react';

import IdlPageClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  const { address } = await props.params;
  return {
    description: `The Interface Definition Language (IDL) file for the program at address ${address} on Solana`,
    title: `Program IDL | ${await getReadableTitleFromAddress(props)} | Solana`,
  };
}

export default async function ProgramIDLPage(props: AddressPageMetadataProps) {
  const resolvedParams = await props.params;
  return <IdlPageClient params={resolvedParams} />;
}
