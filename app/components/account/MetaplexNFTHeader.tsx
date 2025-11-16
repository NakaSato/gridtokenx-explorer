import { InfoTooltip } from '@components/common/InfoTooltip';
import { ArtContent } from '@components/common/NFTArt';
// TODO: Migrate to @metaplex-foundation/mpl-token-metadata v3
// import { programs } from '@metaplex/js';
import { NFTData, useFetchAccountInfo, useMintAccountInfo } from '@providers/accounts';
import { EditionInfo } from '@providers/accounts/utils/getEditionInfo';
import { toAddress, addressToPublicKey } from '@utils/rpc';
import { PublicKey } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React, { createRef } from 'react';
import { AlertOctagon, Check, ChevronDown } from 'react-feather';
import useAsyncEffect from 'use-async-effect';

export function MetaplexNFTHeader({ nftData, address }: { nftData: NFTData; address: string }) {
  const collection = nftData.metadata.collection;
  const collectionAddress = collection?.key;
  const collectionMintInfo = useMintAccountInfo(collectionAddress);
  const fetchAccountInfo = useFetchAccountInfo();

  React.useEffect(() => {
    if (collectionAddress && !collectionMintInfo) {
      fetchAccountInfo(addressToPublicKey(toAddress(collectionAddress)), 'parsed');
    }
  }, [fetchAccountInfo, collectionAddress]); // eslint-disablline react-hooks/exhaustivdeps

  const metadata = nftData.metadata;
  const data = nftData.json;
  const isVerifiedCollection = collection != null && collection?.verified && collectionMintInfo !== undefined;
  const dropdownRef = createRef<HTMLButtonElement>();
  useAsyncEffect(
    async isMounted => {
      if (!dropdownRef.current) {
        return;
      }
      const Dropdown = (await import('bootstrap/js/dist/dropdown')).default;
      if (!isMounted || !dropdownRef.current) {
        return;
      }
      return new Dropdown(dropdownRef.current);
    },
    dropdown => {
      if (dropdown) {
        dropdown.dispose();
      }
    },
    [dropdownRef],
  );
  return (
    <div className="-mx-2 flex flex-wrap">
      <div className="ml-2 flex flex-none items-center">
        <ArtContent pubkey={address} data={data} />
      </div>
      <div className="mt-3 mb-3 ml-0.5 flex-1">
        {<h6 className="text-muted-foreground ml-1 text-xs uppercase">Metaplex NFT</h6>}
        <div className="flex items-center">
          <h2 className="ml-1 items-center truncate text-2xl font-bold">
            {metadata.data.name !== '' ? metadata.data.name : 'No NFT name was found'}
          </h2>
          {getEditionPill(nftData.editionInfo)}
          {isVerifiedCollection ? getVerifiedCollectionPill() : null}
        </div>
        <h4 className="text-muted-foreground mt-1 ml-1 truncate text-xs uppercase">
          {metadata.data.symbol !== '' ? metadata.data.symbol : 'No Symbol was found'}
        </h4>
        <div className="mt-2 mb-2">{getSaleTypePill(metadata.primarySaleHappened)}</div>
        <div className="mt-2 mb-3">{getIsMutablePill(metadata.isMutable)}</div>
        <div className="inline-flex">
          <button
            className="min-w-[120px] rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
            type="button"
            aria-haspopup="true"
            aria-expanded="false"
            data-bs-toggle="dropdown"
            ref={dropdownRef}
          >
            Creators <ChevronDown size={15} className="align-text-top" />
          </button>
          <div className="absolute z-10 mt-12 rounded-md border bg-white shadow-lg">
            {getCreatorDropdownItems(metadata.data.creators)}
          </div>
        </div>
      </div>
    </div>
  );
}

type Creator = any; // TODO: Update to new Metaplex SDK type
export function getCreatorDropdownItems(creators: Creator[] | null) {
  const CreatorHeader = () => {
    const creatorTooltip = 'Verified creators signed the metadata associated with this NFT when it was created.';

    const shareTooltip = 'The percentage of the proceeds a creator receives when this NFT is sold.';

    return (
      <div className={'flex items-center border-b px-4 py-2'}>
        <div className="flex font-mono font-semibold">
          <span>Creator Address</span>
          <InfoTooltip bottom text={creatorTooltip} />
        </div>
        <div className="flex font-mono">
          <span className="font-mono">Royalty</span>
          <InfoTooltip bottom text={shareTooltip} />
        </div>
      </div>
    );
  };

  const getVerifiedIcon = (isVerified: boolean) => {
    return isVerified ? <Check className="ml-3" size={15} /> : <AlertOctagon className="mr-3" size={15} />;
  };

  const CreatorEntry = (creator: Creator) => {
    const creatorPath = useClusterPath({ pathname: `/address/${creator.address}` });
    return (
      <div className={'mr-3 flex items-center px-4 py-2 font-mono'}>
        {getVerifiedIcon(creator.verified)}
        <Link className="block flex-1 px-4 py-2 font-mono hover:bg-gray-100" href={creatorPath}>
          {creator.address}
        </Link>
        <div className="mr-3"> {`${creator.share}%`}</div>
      </div>
    );
  };

  if (creators && creators.length > 0) {
    const listOfCreators: React.JSX.Element[] = [];

    listOfCreators.push(<CreatorHeader key={'header'} />);
    creators.forEach(creator => {
      listOfCreators.push(<CreatorEntry key={creator.address} {...creator} />);
    });

    return listOfCreators;
  }

  return (
    <div className={'px-4 py-2 font-mono'}>
      <div className="mr-3">No creators are associated with this NFT.</div>
    </div>
  );
}

function getEditionPill(editionInfo: EditionInfo) {
  const masterEdition = editionInfo.masterEdition;
  const edition = editionInfo.edition;

  return (
    <div className={'ml-2 inline-flex'}>
      <span className="rounded-full bg-gray-800 px-2 py-1 text-xs text-white">{`${
        edition && masterEdition
          ? `Edition ${edition.edition.toNumber()} / ${masterEdition.supply.toNumber()}`
          : masterEdition
            ? 'Master Edition'
            : 'No Master Edition Information'
      }`}</span>
    </div>
  );
}

function getSaleTypePill(hasPrimarySaleHappened: boolean) {
  const primaryMarketTooltip = 'Creator(s) split 100% of the proceeds when this NFT is sold.';

  const secondaryMarketTooltip =
    'Creator(s) split the Seller Fee when this NFT is sold. The owner receives the remaining proceeds.';

  return (
    <div className={'inline-flex items-center'}>
      <span className="rounded-full bg-gray-800 px-2 py-1 text-xs text-white">{`${
        hasPrimarySaleHappened ? 'Secondary Market' : 'Primary Market'
      }`}</span>
      <InfoTooltip bottom text={hasPrimarySaleHappened ? secondaryMarketTooltip : primaryMarketTooltip} />
    </div>
  );
}

export function getIsMutablePill(isMutable: boolean) {
  return (
    <span className="rounded-full bg-gray-800 px-2 py-1 text-xs text-white">{`${isMutable ? 'Mutable' : 'Immutable'}`}</span>
  );
}

export function getVerifiedCollectionPill() {
  const onchainVerifiedToolTip =
    'This NFT has been verified as a member of an on-chain collection. This tag guarantees authenticity.';
  return (
    <div className={'ml-2 inline-flex items-center'}>
      <span className="rounded-full bg-gray-800 px-2 py-1 text-xs text-white">{'Verified Collection'}</span>
      <InfoTooltip bottom text={onchainVerifiedToolTip} />
    </div>
  );
}
