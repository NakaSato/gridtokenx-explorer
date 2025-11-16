import { Address } from '@components/common/Address';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account, useFetchAccountInfo } from '@providers/accounts';
import { Button } from '@components/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@components/shared/ui/card';
import { PublicKey } from '@solana/web3.js';
import { addressToPublicKey, toAddress } from '@utils/rpc';
import { Suspense, useState } from 'react';
import { RefreshCw } from 'react-feather';

import { getProxiedUri } from '@/app/features/metadata/utils';

import { UnknownAccountCard } from '../UnknownAccountCard';
import { parseNFTokenCollectionAccount, parseNFTokenNFTAccount } from './isNFTokenAccount';
import { useCollectionNfts } from './nftoken-hooks';
import { NftokenTypes } from './nftoken-types';

export function NFTokenAccountSection({ account }: { account: Account }) {
    const nft = parseNFTokenNFTAccount(account);
    if (nft) {
        return <NFTCard nft={nft} />;
    }

    const collection = parseNFTokenCollectionAccount(account);
    if (collection) {
        return <CollectionCard collection={collection} />;
    }

    return <UnknownAccountCard account={account} />;
}

const NFTCard = ({ nft }: { nft: NftokenTypes.NftAccount }) => {
    const fetchInfo = useFetchAccountInfo();
    const refresh = () => fetchInfo(addressToPublicKey(toAddress(nft.address)), 'parsed');

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Overview</CardTitle>
                    <Button variant="outline" size="sm" onClick={refresh}>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <TableCardBody>
                    <tr>
                        <td>Address</td>
                        <td className="lg:text-right">
                            <Address pubkey={addressToPublicKey(toAddress(nft.address))} alignRight raw />
                        </td>
                    </tr>
                    <tr>
                        <td>Authority</td>
                        <td className="lg:text-right">
                            <Address pubkey={addressToPublicKey(toAddress(nft.authority))} alignRight link />
                        </td>
                    </tr>
                    <tr>
                        <td>Holder</td>
                        <td className="lg:text-right">
                            <Address pubkey={addressToPublicKey(toAddress(nft.holder))} alignRight link />
                        </td>
                    </tr>
                    <tr>
                        <td>Delegate</td>
                        <td className="lg:text-right">
                            {nft.delegate ? (
                                <Address pubkey={addressToPublicKey(toAddress(nft.delegate))} alignRight link />
                            ) : (
                                'Not Delegated'
                            )}
                        </td>
                    </tr>
                    <tr>
                        <td>Collection</td>
                        <td className="lg:text-right">
                            {nft.collection ? (
                                <Address pubkey={addressToPublicKey(toAddress(nft.collection))} alignRight link />
                            ) : (
                                'No Collection'
                            )}
                        </td>
                    </tr>
                </TableCardBody>
            </CardContent>
        </Card>
    );
};

export const NftokenImage = ({ url, size }: { url: string | undefined; size: number }) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);

    return (
        <>
            {isLoading && (
                <div
                    style={{
                        backgroundColor: 'lightgrey',
                        height: size,
                        width: size,
                    }}
                />
            )}
            <div className={`rounded mx-auto ${isLoading ? 'd-none' : 'd-block'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    alt="nft"
                    height={size}
                    onLoad={() => {
                        setIsLoading(false);
                    }}
                    src={url ? getProxiedUri(url) : url}
                    width={size}
                />
            </div>
        </>
    );
};

const CollectionCard = ({ collection }: { collection: NftokenTypes.CollectionAccount }) => {
    const fetchInfo = useFetchAccountInfo();
    const refresh = () => fetchInfo(addressToPublicKey(toAddress(collection.address)), 'parsed');

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Overview</CardTitle>
                    <Button variant="outline" size="sm" onClick={refresh}>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <TableCardBody>
                    <tr>
                        <td>Address</td>
                        <td className="lg:text-right">
                            <Address pubkey={addressToPublicKey(toAddress(collection.address))} alignRight raw />
                        </td>
                    </tr>
                    <tr>
                        <td>Authority</td>
                        <td className="lg:text-right">
                            <Address pubkey={addressToPublicKey(toAddress(collection.authority))} alignRight link />
                        </td>
                    </tr>
                    <tr>
                        <td>Number of NFTs</td>
                        <td className="lg:text-right">
                            <Suspense fallback={<div>Loading...</div>}>
                                <NumNfts collection={collection.address} />
                            </Suspense>
                        </td>
                    </tr>
                </TableCardBody>
            </CardContent>
        </Card>
    );
};

const NumNfts = ({ collection }: { collection: string }) => {
    const { data: nfts } = useCollectionNfts({ collectionAddress: collection });
    return <div>{nfts.length}</div>;
};
