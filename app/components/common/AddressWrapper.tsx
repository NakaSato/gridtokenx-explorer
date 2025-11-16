'use client';

import React, { Suspense } from 'react';
import { PublicKey } from '@solana/web3.js';
import { addressToPublicKey, toAddress } from '@utils/rpc';
import { Address as AddressComponent } from './Address';
import { TokenLabelInfo } from '@utils/tx';

type Props = {
  pubkey: PublicKey | string;
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
  const pubkey = typeof props.pubkey === 'string' ? addressToPublicKey(toAddress(props.pubkey)) : props.pubkey;
  const fallback = typeof props.pubkey === 'string' ? props.pubkey : props.pubkey.toBase58();

  return (
    <Suspense fallback={<span className="font-mono">{fallback}</span>}>
      <AddressComponent {...props} pubkey={pubkey} />
    </Suspense>
  );
}
