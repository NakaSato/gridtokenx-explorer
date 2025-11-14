'use client';

// import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { displayAddress, TokenLabelInfo } from '@utils/tx';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React from 'react';
import { useState } from 'react';
import useAsyncEffect from 'usasync-effect';

import { getTokenInfoWithoutOnChainFallback } from '@/app/utils/token-info';

import { Copyable } from './Copyable';

type Props = {
    pubkey: PublicKey;
    alignRight?: boolean;
    link?: boolean;
    raw?: boolean;
    truncate?: boolean;
    truncateUnknown?: boolean;
    truncateChars?: number;
    useMetadata?: boolean;
    overrideText?: string;
    tokenLabelInfo?: TokenLabelInfo;
    fetchTokenLabelInfo?: boolean;
};

export function Address({
    pubkey,
    alignRight,
    link,
    raw,
    truncate,
    truncateUnknown,
    truncateChars,
    useMetadata,
    overrideText,
    tokenLabelInfo,
    fetchTokenLabelInfo,
}: Props) {
    const address = pubkey.toBase58();
    const { cluster } = useCluster();
    const addressPath = useClusterPath({ pathname: `/address/${address}` });

    const display = displayAddress(address, cluster, tokenLabelInfo);
    if (truncateUnknown && address === display) {
        truncate = true;
    }

    let addressLabel = raw ? address : display;

    const metaplexData = useTokenMetadata(useMetadata, address);
    // Temporarily disabled - needs migration to new Metaplex SDK
    // if (metaplexData && metaplexData.data) {
    //     addressLabel = metaplexData.data.data.name;
    // }

    const tokenInfo = useTokenInfo(fetchTokenLabelInfo, address);
    if (tokenInfo) {
        addressLabel = displayAddress(address, cluster, tokenInfo);
    }

    if (truncateChars && addressLabel === address) {
        addressLabel = addressLabel.slice(0, truncateChars) + '…';
    }

    if (overrideText) {
        addressLabel = overrideText;
    }

    const handleMouseEnter = (text: string) => {
        const elements = document.querySelectorAll(`[data-address="${text}"]`);
        elements.forEach(el => {
            (el as HTMLElement).classList.add('address-highlight');
        });
    };

    const handleMouseLeave = (text: string) => {
        const elements = document.querySelectorAll(`[data-address="${text}"]`);
        elements.forEach(el => {
            (el as HTMLElement).classList.remove('address-highlight');
        });
    };

    const content = (
        <Copyable text={address} replaceText={!alignRight}>
            <span
                data-address={address}
                className="font-monospace"
                onMouseEnter={() => handleMouseEnter(address)}
                onMouseLeave={() => handleMouseLeave(address)}
            >
                {link ? (
                    <Link className={truncate ? 'text-truncate address-truncate' : ''} href={addressPath}>
                        {addressLabel}
                    </Link>
                ) : (
                    <span className={truncate ? 'text-truncate address-truncate' : ''}>{addressLabel}</span>
                )}
            </span>
        </Copyable>
    );

    return (
        <>
            <div className={`d-none d-lg-flex align-items-center ${alignRight ? 'justify-content-end' : ''}`}>
                {content}
            </div>
            <div className="d-flex d-lg-none align-items-center">{content}</div>
        </>
    );
}
const useTokenMetadata = (useMetadata: boolean | undefined, pubkey: string) => {
    // TODO: Rimplement with @metaplex-foundation/mpl-token-metadata v3
    // const [data, setData] = useState<any>();
    // const { url } = useCluster();

    // useAsyncEffect(
    //     async isMounted => {
    //         if (!useMetadata) return;
    //         if (pubkey && !data) {
    //             try {
    //                 // Update to use new Metaplex SDK
    //                 if (isMounted()) {
    //                     setData(undefined);
    //                 }
    //             } catch {
    //                 if (isMounted()) {
    //                     setData(undefined);
    //                 }
    //             }
    //         }
    //     },
    //     [useMetadata, pubkey, data, setData]
    //     );
    return { data: undefined };
};

const useTokenInfo = (fetchTokenLabelInfo: boolean | undefined, pubkey: string) => {
    const [info, setInfo] = useState<TokenLabelInfo>();
    const { cluster, url } = useCluster();

    useAsyncEffect(
        async isMounted => {
            if (!fetchTokenLabelInfo) return;
            if (!info) {
                try {
                    const token = await getTokenInfoWithoutOnChainFallback(new PublicKey(pubkey), cluster);
                    if (isMounted()) {
                        setInfo(token);
                    }
                } catch {
                    if (isMounted()) {
                        setInfo(undefined);
                    }
                }
            }
        },
        [fetchTokenLabelInfo, pubkey, cluster, url, info, setInfo]
    );

    return info;
};
