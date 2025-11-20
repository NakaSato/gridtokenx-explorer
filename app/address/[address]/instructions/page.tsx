import { TokenInstructionsCard } from '@/app/(features)/accounts/components/history/TokenInstructionsCard';
import getReadableTitleFromAddress, {
  AddressPageMetadataProps,
} from '@/app/(shared)/utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

type Props = Readonly<{
  params: {
    address: string;
  };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
  const { address } = await props.params;
  return {
    description: `A list of transactions that include an instruction involving a token with address ${address} on Solana`,
    title: `Token Instructions | ${await getReadableTitleFromAddress(props)} | Solana`,
  };
}

export default async function TokenInstructionsPage(props: Props) {
  const { address } = await props.params;
  return <TokenInstructionsCard address={address} />;
}
