import { NFTokenCollectionNFTGrid } from '@/app/(features)/accounts/components/nftoken/NFTokenCollectionNFTGrid';
import getReadableTitleFromAddress, {
  AddressPageMetadataProps,
} from '@/app/(shared)/utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
  searchParams: Promise<{
    cluster: string;
    customUrl?: string;
  }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  const { address } = await props.params;
  return {
    description: `NFToken NFTs belonging to the collection ${address} on Solana`,
    title: `NFToken Collection NFTs | ${address} | Solana`,
  };
}

export default async function NFTokenCollectionPage(props: Props) {
  const { address } = await props.params;
  return <NFTokenCollectionNFTGrid collection={address} />;
}
