'use client';

import { useClusterPath } from '@/app/(shared)/utils/url';
import { Button } from '@/app/(shared)/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/(shared)/components/ui/card';
import Link from 'next/link';
import React from 'react';
import { RefreshCw } from 'react-feather';

import { useCollectionNfts } from './nftoken-hooks';
import { NftokenTypes } from './nftoken-types';
import { NftokenImage } from './NFTokenAccountSection';

export function NFTokenCollectionNFTGrid({ collection }: { collection: string }) {
  const { data: nfts, mutate } = useCollectionNfts({
    collectionAddress: collection,
  });
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">NFTs</CardTitle>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {nfts.length === 0 && <div className="px-4">No NFTs Found</div>}

        {nfts.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridGap: '1.5rem',
              /* Creates as many columns as possible that are at least 10rem wide. */
              gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
            }}
          >
            {nfts.map(nft => (
              <Nft nft={nft} key={nft.address} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Nft({ nft }: { nft: NftokenTypes.NftInfo }) {
  const nftPath = useClusterPath({ pathname: `/address/${nft.address}` });
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        justifyContent: 'center',
      }}
    >
      <NftokenImage url={nft.image} size={80} />
      <div>
        <Link href={nftPath}>
          <div>{nft.name ?? 'No Name'}</div>
        </Link>
      </div>
    </div>
  );
}
