'use client';

import React, { Suspense } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Address as AddressComponent } from './Address';
import { TokenLabelInfo } from '@utils/tx';

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

export function Address(props: Props) {
    return (
        <Suspense fallback={<span className="font-monospace">{props.pubkey.toBase58()}</span>}>
            <AddressComponent {...props} />
        </Suspense>
    );
}
