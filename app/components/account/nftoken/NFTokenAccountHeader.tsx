import { InfoTooltip } from '@components/common/InfoTooltip';
import { LoadingArtPlaceholder } from '@components/common/LoadingArtPlaceholder';
import { NFTImageContent } from '@components/common/NFTArt';
import { Account } from '@providers/accounts';
import React, { Suspense } from 'react';

import { parseNFTokenCollectionAccount, parseNFTokenNFTAccount } from './isNFTokenAccount';
import { useNftokenMetadata } from './nftoken-hooks';
import { NftokenTypes } from './nftoken-types';

export function NFTokenAccountHeader({ account }: { account: Account }) {
    const nft = parseNFTokenNFTAccount(account);

    if (nft) {
        return (
            <Suspense fallback={<LoadingArtPlaceholder />}>
                <NFTokenNFTHeader nft={nft} />
            </Suspense>
        );
    }

    const collection = parseNFTokenCollectionAccount(account);
    if (collection) {
        return (
            <Suspense fallback={<LoadingArtPlaceholder />}>
                <NFTokenCollectionHeader collection={collection} />
            </Suspense>
        );
    }

    return (
        <>
            <h6 className="text-muted-foreground text-xs uppercase">Details</h6>
            <h2 className="text-2xl font-bold">Account</h2>
        </>
    );
}

export function NFTokenNFTHeader({ nft }: { nft: NftokenTypes.NftAccount }) {
    const { data: metadata } = useNftokenMetadata(nft.metadata_url);

    return (
        <div className="-mx-2 flex flex-wrap">
            <div className="ml-2 flex flex-none items-center">
                <NFTImageContent uri={metadata?.image.trim()} />
            </div>

            <div className="mt-3 mb-3 ml-0.5 flex-1">
                {<h6 className="text-muted-foreground ml-1 text-xs uppercase">NFToken NFT</h6>}
                <div className="flex items-center">
                    <h2 className="ml-1 items-center truncate text-2xl font-bold">
                        {metadata ? metadata.name || 'No NFT name was found' : 'Loading...'}
                    </h2>
                </div>

                <div>
                    <div className={'mt-2 inline-flex items-center'}>
                        <span className="rounded-full bg-gray-800 px-2 py-1 text-xs text-white">{`${
                            nft.authority_can_update ? 'Mutable' : 'Immutable'
                        }`}</span>

                        <InfoTooltip
                            bottom
                            text={
                                nft.authority_can_update
                                    ? 'The authority of this NFT can update the Metadata.'
                                    : 'The Metadata cannot be updated by anyone.'
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function NFTokenCollectionHeader({ collection }: { collection: NftokenTypes.CollectionAccount }) {
    const { data: metadata } = useNftokenMetadata(collection.metadata_url);

    return (
        <div className="-mx-2 flex flex-wrap">
            <div className="ml-2 flex flex-none items-center">
                <NFTImageContent uri={metadata?.image} />
            </div>

            <div className="mt-3 mb-3 ml-0.5 flex-1">
                {<h6 className="text-muted-foreground ml-1 text-xs uppercase">NFToken Collection</h6>}
                <div className="flex items-center">
                    <h2 className="ml-1 items-center truncate text-2xl font-bold">
                        {metadata ? metadata.name || 'No collection name was found' : 'Loading...'}
                    </h2>
                </div>

                <div>
                    <div className={'mt-2 inline-flex items-center'}>
                        <span className="rounded-full bg-gray-800 px-2 py-1 text-xs text-white">{`${
                            collection.authority_can_update ? 'Mutable' : 'Immutable'
                        }`}</span>

                        <InfoTooltip
                            bottom
                            text={
                                collection.authority_can_update
                                    ? 'The authority of this Collection can update the Metadata and add NFTs.'
                                    : 'The Metadata cannot be updated by anyone.'
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
