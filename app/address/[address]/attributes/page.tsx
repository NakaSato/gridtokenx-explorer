import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@/app/(shared)/utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import NFTAttributesPageClient from './page-client';

type Props = Readonly<{
  params: {
    address: string;
  };
  searchParams: {
    cluster?: string;
    customUrl?: string;
  };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  return {
    description: `Attributes of the Metaplex NFT with address ${(await props.params).address} on Solana`,
    title: `Metaplex NFT Attributes | ${await getReadableTitleFromAddress(props)} | Solana`,
  };
}

export default function MetaplexNFTAttributesPage(props: Props) {
  return <NFTAttributesPageClient {...props} />;
}
