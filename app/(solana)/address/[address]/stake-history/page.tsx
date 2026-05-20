import StakeHistoryPageClient from './page-client';

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
}>;

export const metadata = {
  description: `Stake history for each epoch on Solana`,
  title: `Stake History | Solana`
};

export default async function StakeHistoryPage({ params }: Props) {
  const resolvedParams = await params;
  return <StakeHistoryPageClient params={resolvedParams} />;
}
