import { Metadata } from 'next/types';

import BlockDetailsPageClient from './page-client';

type Props = Readonly<{
  params: Promise<{
    slot: string;
  }>;
}>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slot } = await params;
  return {
    description: `Overview of block ${slot} on Solana`,
    title: `Block | ${slot} | Solana`,
  };
}

export default async function BlockDetailsPage({ params }: Props) {
  const resolvedParams = await params;
  return <BlockDetailsPageClient params={resolvedParams} />;
}
