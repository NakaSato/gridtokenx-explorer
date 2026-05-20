import { PublicKey } from '@solana/web3.js';

import { useCluster } from '@/app/(core)/providers/cluster';
import { useMetadataJsonLink } from '@/app/(core)/providers/compressed-nft';
import { useCompressedNft as useAsset } from '@/app/(core)/providers/compressed-nft';

import { getProxiedUri } from '../utils';

export function useOffChainMetadata(pubkey: PublicKey): { metadata: Record<string, unknown> | null } {
  const { url } = useCluster();
  const asset = useAsset({ address: pubkey.toBase58(), url });

  const isCompressed = Boolean(asset?.compression.compressed);
  const jsonUri = asset?.content?.json_uri || null;

  const metadataJson = useMetadataJsonLink(isCompressed && jsonUri ? getProxiedUri(jsonUri) : null, {
    suspense: true,
  });

  return {
    metadata: metadataJson || null,
  };
}
