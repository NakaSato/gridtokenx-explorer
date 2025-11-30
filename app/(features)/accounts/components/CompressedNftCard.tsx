import { Account } from '@/app/(core)/providers/accounts';
import { toAddress, addressToPublicKey } from '@/app/(shared)/utils/rpc';
import { PublicKey } from '@solana/web3.js';
import { Suspense } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';

import { getProxiedUri } from '@/app/features/metadata';
import { useCluster } from '@/app/(core)/providers/cluster';
import { CompressedNft, useCompressedNft, useMetadataJsonLink } from '@/app/(core)/providers/compressed-nft';

import { Address } from '@/app/(shared)/components/Address';
import { InfoTooltip } from '@/app/(shared)/components/InfoTooltip';
import { LoadingArtPlaceholder } from '@/app/(shared)/components/LoadingArtPlaceholder';
import { ArtContent } from '@/app/(shared)/components/NFTArt';
import { TableCardBody } from '@/app/(shared)/components/TableCardBody';
import { getCreatorDropdownItems, getIsMutablePill, getVerifiedCollectionPill } from './MetaplexNFTHeader';
import { UnknownAccountCard } from './UnknownAccountCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/app/(shared)/components/ui/dropdown-menu';

export function CompressedNftCard({ account }: { account: Account }) {
  const { url } = useCluster();
  const compressedNft = useCompressedNft({ address: account.pubkey.toString(), url });
  if (!compressedNft) return <UnknownAccountCard account={account} />;

  const collectionGroup = compressedNft.grouping.find(group => group.group_key === 'collection');
  const updateAuthority = compressedNft.authorities.find(authority => authority.scopes.includes('full'))?.address;

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="border-b px-6 py-4">
        <h3 className="mb-0 flex items-center text-lg font-semibold">Overview</h3>
      </div>
      <TableCardBody>
        <tr>
          <td>Address</td>
          <td className="lg:text-right">
            <Address pubkey={account.pubkey} alignRight raw />
          </td>
        </tr>
        <tr>
          <td>Owner</td>
          <td className="lg:text-right">
            <Address pubkey={addressToPublicKey(toAddress(compressedNft.ownership.owner))} alignRight link />
          </td>
        </tr>
        <tr>
          <td>Verified Collection Address</td>
          <td className="lg:text-right">
            {collectionGroup ? (
              <Address pubkey={addressToPublicKey(toAddress(collectionGroup.group_value))} alignRight link />
            ) : (
              'None'
            )}
          </td>
        </tr>
        <tr>
          <td>Update Authority</td>
          <td className="lg:text-right">
            {updateAuthority ? (
              <Address pubkey={addressToPublicKey(toAddress(updateAuthority))} alignRight link />
            ) : (
              'None'
            )}
          </td>
        </tr>
        <tr>
          <td>Website</td>
          <td className="lg:text-right">
            <a rel="noopener noreferrer" target="_blank" href={compressedNft.content.links.external_url}>
              {compressedNft.content.links.external_url}
              <ExternalLink className="ml-2 align-text-top" size={13} />
            </a>
          </td>
        </tr>
        <tr>
          <td>Seller Fee</td>
          <td className="lg:text-right">{`${compressedNft.royalty.basis_points / 100}%`}</td>
        </tr>
      </TableCardBody>
    </div>
  );
}

export function CompressedNftAccountHeader({ account }: { account: Account }) {
  const { url } = useCluster();
  const compressedNft = useCompressedNft({ address: account.pubkey.toString(), url });

  if (compressedNft) {
    return (
      <Suspense fallback={<LoadingArtPlaceholder />}>
        <CompressedNFTHeader compressedNft={compressedNft} />
      </Suspense>
    );
  }
  return <div />;
}

export function CompressedNFTHeader({ compressedNft }: { compressedNft: CompressedNft }) {
  // Empty strings are possible, so the check is necessary.
  const proxiedURI = compressedNft.content.json_uri ? getProxiedUri(compressedNft.content.json_uri) : null;
  const metadataJson = useMetadataJsonLink(proxiedURI);

  return (
    <div className="flex flex-row">
      <div className="ml-2 flex flex-shrink-0 items-center">
        <ArtContent pubkey={compressedNft.id} data={metadataJson} />
      </div>
      <div className="mt-3 mb-3 ml-0.5 flex-1">
        {<h6 className="header-pretitle ml-1">Metaplex Compressed NFT</h6>}
        <div className="flex items-center">
          <h2 className="header-title no-overflow-with-ellipsis ml-1 items-center">
            {compressedNft.content.metadata.name !== '' ? compressedNft.content.metadata.name : 'No NFT name was found'}
          </h2>
          {getVerifiedCollectionPill()}
        </div>
        <h4 className="header-pretitle no-overflow-with-ellipsis mt-1 ml-1">
          {compressedNft.content.metadata.symbol !== '' ? compressedNft.content.metadata.symbol : 'No Symbol was found'}
        </h4>
        <div className="mt-2 mb-2">{getCompressedNftPill()}</div>
        <div className="mt-2 mb-3">{getIsMutablePill(compressedNft.mutable)}</div>
        <div className="inline-flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="creators-dropdown-button-width rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700 flex items-center justify-between"
                type="button"
              >
                Creators <ChevronDown size={15} className="ml-2" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-auto p-0" align="end">
              {getCreatorDropdownItems(compressedNft.creators)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function getCompressedNftPill() {
  const onchainVerifiedToolTip =
    'This NFT does not have a corresponding account, but uses verified ledger data to allow for transfers and trades. The existence of this tag ensures that the compressed NFT is verifiably up-to-date with the chain.';
  return (
    <div className={'ml-2 inline-flex items-center'}>
      <span className="rounded-full bg-gray-800 px-2 py-1 text-xs text-white">{'Compressed'}</span>
      <InfoTooltip bottom text={onchainVerifiedToolTip} />
    </div>
  );
}
