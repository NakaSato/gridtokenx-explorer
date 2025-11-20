import { PublicKey } from '@solana/web3.js';
import { Cluster, clusterUrl } from '@/app/(shared)/utils/cluster';

import { getTokenInfo } from './token-info';

export type AddressPageMetadataProps = Readonly<{
  params: Promise<{
    address: string;
  }>;
  searchParams: Promise<{
    cluster: string;
    customUrl?: string;
  }>;
}>;

export default async function getReadableTitleFromAddress(props: AddressPageMetadataProps): Promise<string> {
  const params = await props.params;
  const { address } = params;

  // Skip network requests during build time to avoid hanging
  // Just return the address as fallback
  const tokenDisplayAddress = address.slice(0, 2) + '\u2026' + address.slice(-2);
  return `Address | ${tokenDisplayAddress}`;
}
