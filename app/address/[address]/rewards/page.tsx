import { RewardsCard } from '@/app/(shared)/components/account/RewardsCard';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@/app/(shared)/utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

type Props = Readonly<{
  params: {
    address: string;
  };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  return {
    description: `Rewards due to the address ${props.params.address} by epoch on Solana`,
    title: `Address Rewards | ${await getReadableTitleFromAddress(props)} | Solana`,
  };
}

export default function BlockRewardsPage({ params: { address } }: Props) {
  return <RewardsCard address={address} />;
}
