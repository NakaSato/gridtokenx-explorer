import RecentBlockhashesPageClient from './page-client';

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
}>;

export const metadata = {
  description: `Recent blockhashes on Solana`,
  title: `Recent Blockhashes | Solana`
};

export default async function RecentBlockhashesPage({ params }: Props) {
  const resolvedParams = await params;
  return <RecentBlockhashesPageClient params={resolvedParams} />;
}
