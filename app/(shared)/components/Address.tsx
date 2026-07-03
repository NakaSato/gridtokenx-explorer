'use client';

import { Connection, PublicKey } from '@solana/web3.js';

import { fetchNftMetadata, NFTMetadata } from '@/app/(core)/providers/accounts/utils/metaplexMetadata';
import { useCluster } from '@/app/(core)/providers/cluster';
import { displayAddress, TokenLabelInfo } from '@/app/(shared)/utils/tx';
import { useClusterPath } from '@/app/(shared)/utils/url';
import Link from 'next/link';
import { useState } from 'react';
import useAsyncEffect from 'use-async-effect';

import { getTokenInfoWithoutOnChainFallback } from '@/app/(shared)/utils/token-info';

import { Copyable } from '@/app/(shared)/components/Copyable';

/**
 * PublicKey-like type for compatibility
 */
type PublicKeyLike = {
  toBase58(): string;
  equals?(other: PublicKeyLike): boolean;
  toBuffer?(): Buffer;
};

type Props = {
  pubkey: PublicKeyLike;
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
  if (!raw && metaplexData.data?.data.name) {
    addressLabel = metaplexData.data.data.name;
  }

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
        className="font-mono"
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
      <div className={`hidden items-center lg:flex ${alignRight ? 'justify-end' : ''}`}>{content}</div>
      <div className="flex items-center lg:hidden">{content}</div>
    </>
  );
}
const useTokenMetadata = (useMetadata: boolean | undefined, pubkey: string) => {
  const [data, setData] = useState<NFTMetadata>();
  const { url } = useCluster();

  useAsyncEffect(
    async isMounted => {
      if (!useMetadata || !pubkey || data) return;
      try {
        const connection = new Connection(url);
        const metadata = await fetchNftMetadata(connection, new PublicKey(pubkey));
        if (isMounted()) {
          setData(metadata);
        }
      } catch {
        if (isMounted()) {
          setData(undefined);
        }
      }
    },
    [useMetadata, pubkey, url],
  );

  return { data };
};

const useTokenInfo = (fetchTokenLabelInfo: boolean | undefined, addressStr: string) => {
  const [info, setInfo] = useState<TokenLabelInfo>();
  const { cluster, url } = useCluster();

  useAsyncEffect(
    async isMounted => {
      if (!fetchTokenLabelInfo) return;
      if (!info) {
        try {
          // Fetch token info using the address string directly
          const response = await fetch(`/api/token-info?address=${addressStr}&cluster=${cluster}`);
          if (response.ok) {
            const result = await response.json();
            if (isMounted()) {
              setInfo(result.data);
            }
          } else {
            if (isMounted()) {
              setInfo(undefined);
            }
          }
        } catch {
          if (isMounted()) {
            setInfo(undefined);
          }
        }
      }
    },
    [fetchTokenLabelInfo, addressStr, cluster, url, info, setInfo],
  );

  return info;
};
