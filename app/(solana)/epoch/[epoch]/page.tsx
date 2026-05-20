import { Metadata } from 'next/types';

import EpochDetailsPageClient from './page-client';

type Props = Readonly<{
  params: Promise<{
    epoch: string;
  }>;
}>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { epoch } = await params;
  return {
    description: `Summary of ${epoch} on Solana`,
    title: `Epoch | ${epoch} | Solana`,
  };
}

export default async function EpochDetailsPage({ params }: Props) {
  const resolvedParams = await params;
  return <EpochDetailsPageClient params={resolvedParams} />;
}
