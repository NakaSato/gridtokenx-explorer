import lowContrastSolanalogo from '@img/logos-solana/low-contrast-solana-logo.svg';
import { PublicKey } from '@solana/web3.js';

import { MetadataJson } from '@/app/(core)/providers/accounts/utils/metaplexMetadata';
export type { MetadataJson } from '@/app/(core)/providers/accounts/utils/metaplexMetadata';
import Link from 'next/link';

import { isEnvEnabled } from '@/app/(config)/env';

import { InfoTooltip } from './InfoTooltip';

const isDisplayEnabled = isEnvEnabled(process.env.NEXT_PUBLIC_VIEW_ORIGINAL_DISPLAY_ENABLED);

export const MAX_TIME_LOADING_IMAGE = 5000; /* 5 seconds */

const ViewOriginalArtContentLink = ({ src }: { src: string }) => {
  if (!src) {
    return null;
  }

  return (
    <h6 className="header-pretitle mt-2 flex justify-center">
      {!isDisplayEnabled ? null : (
        <Link href={src} target="_blank" className="flex items-center">
          <div>VIEW ORIGINAL</div>
          <div className="flex">
            <InfoTooltip right text="By clicking the link external resource will be open" />
          </div>
        </Link>
      )}
    </h6>
  );
};

export const NFTImageContent = ({ uri }: { uri?: string }) => {
  return (
    <div style={{ maxHeight: 200, width: 150 }}>
      <div className="d-block mx-auto rounded" style={{ overflow: 'hidden' }}>
        {/* eslint-disablnext-line @next/next/no-img-element */}
        <img alt="nft" src={lowContrastSolanalogo.src} width="100%" />
      </div>
      {uri && <ViewOriginalArtContentLink src={uri} />}
    </div>
  );
};

export const ArtContent = ({
  pubkey,
  uri,
  data,
}: {
  pubkey?: PublicKey | string;
  uri?: string;
  data: MetadataJson | undefined;
}) => {
  if (pubkey && data) {
    uri = data.image;
  }

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <NFTImageContent uri={uri} />
    </div>
  );
};
