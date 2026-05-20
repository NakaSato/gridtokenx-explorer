import SlotHashesPageClient from './page-client';

type Props = Readonly<{
  params: Promise<{
    address: string;
  }>;
}>;

export const metadata = {
  description: `Hashes of each slot on Solana`,
  title: `Slot Hashes | Solana`
};

export default async function SlotHashesPage({ params }: Props) {
  const resolvedParams = await params;
  return <SlotHashesPageClient params={resolvedParams} />;
}
