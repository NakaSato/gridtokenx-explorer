/**
 * Metaplex Token Metadata (mpl-token-metadata v3) helpers.
 *
 * v3 is UMI-based, but the account-data serializers are pure functions, so we
 * decode raw accounts fetched with a regular web3.js Connection and map the
 * result into the legacy (v2-style) shape the explorer components were
 * written against: option fields unwrapped to `T | null`, addresses as base58
 * strings, and `name`/`symbol`/`uri` nested under `metadata.data`.
 */
import {
  getEditionAccountDataSerializer,
  getMasterEditionAccountDataSerializer,
  getMetadataAccountDataSerializer,
  Key,
  MetadataAccountData,
} from '@metaplex-foundation/mpl-token-metadata';
import { Connection, PublicKey } from '@solana/web3.js';

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

type UmiOption<T> = { __option: 'Some'; value: T } | { __option: 'None' };

function unwrapOption<T>(option: UmiOption<T> | T | null | undefined): T | null {
  if (option == null) return null;
  if (typeof option === 'object' && '__option' in (option as object)) {
    const opt = option as UmiOption<T>;
    return opt.__option === 'Some' ? opt.value : null;
  }
  return option as T;
}

/** Minimal BN-compatible wrapper — legacy components call `.toNumber()`. */
export type BigNumLike = { toNumber(): number };

function toBigNumLike(value: bigint | number): BigNumLike {
  return { toNumber: () => Number(value) };
}

export type NFTCreator = {
  address: string;
  verified: boolean;
  share: number;
};

export type NFTMetadata = {
  key: number;
  updateAuthority: string;
  mint: string;
  data: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: NFTCreator[] | null;
  };
  primarySaleHappened: boolean;
  isMutable: boolean;
  editionNonce: number | null;
  tokenStandard: number | null;
  collection: { verified: boolean; key: string } | null;
};

/** Off-chain JSON pointed to by `metadata.data.uri` (Metaplex JSON standard). */
export type MetadataJson = {
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  external_url?: string;
  seller_fee_basis_points?: number;
  attributes?: Array<{ trait_type?: string; value?: string | number }>;
  properties?: {
    category?: string;
    files?: Array<{ uri: string; type: string }>;
    creators?: NFTCreator[];
  };
};

export function getMetadataPda(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
}

export function getEditionPda(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from('edition')],
    TOKEN_METADATA_PROGRAM_ID,
  )[0];
}

function toLegacyMetadata(account: MetadataAccountData): NFTMetadata {
  const creators = unwrapOption(account.creators as unknown as UmiOption<Array<NFTCreator>>);
  const collection = unwrapOption(account.collection as unknown as UmiOption<{ verified: boolean; key: string }>);
  const tokenStandard = unwrapOption(account.tokenStandard as unknown as UmiOption<number>);
  const editionNonce = unwrapOption(account.editionNonce as unknown as UmiOption<number>);

  return {
    collection: collection ? { key: String(collection.key), verified: collection.verified } : null,
    data: {
      creators: creators
        ? creators.map(creator => ({
            address: String(creator.address),
            share: creator.share,
            verified: creator.verified,
          }))
        : null,
      name: account.name,
      sellerFeeBasisPoints: account.sellerFeeBasisPoints,
      symbol: account.symbol,
      uri: account.uri,
    },
    editionNonce,
    isMutable: account.isMutable,
    key: account.key as unknown as number,
    mint: String(account.mint),
    primarySaleHappened: account.primarySaleHappened,
    tokenStandard: tokenStandard != null ? Number(tokenStandard) : null,
    updateAuthority: String(account.updateAuthority),
  };
}

/**
 * Fetch and decode the token-metadata account for a mint.
 * Returns undefined when the mint has no metadata account.
 */
export async function fetchNftMetadata(connection: Connection, mint: PublicKey): Promise<NFTMetadata | undefined> {
  const account = await connection.getAccountInfo(getMetadataPda(mint));
  if (!account || !account.owner.equals(TOKEN_METADATA_PROGRAM_ID)) return undefined;
  const [data] = getMetadataAccountDataSerializer().deserialize(account.data);
  return toLegacyMetadata(data);
}

export type MasterEditionInfo = {
  key: number;
  supply: BigNumLike;
  maxSupply: BigNumLike | null;
};

export type EditionInfoData = {
  key: number;
  parent: string;
  edition: BigNumLike;
};

export function decodeMasterEdition(data: Uint8Array): MasterEditionInfo {
  const [master] = getMasterEditionAccountDataSerializer().deserialize(data);
  const maxSupply = unwrapOption(master.maxSupply as unknown as UmiOption<bigint>);
  return {
    key: master.key as unknown as number,
    maxSupply: maxSupply != null ? toBigNumLike(maxSupply) : null,
    supply: toBigNumLike(master.supply),
  };
}

export function decodeEdition(data: Uint8Array): EditionInfoData {
  const [edition] = getEditionAccountDataSerializer().deserialize(data);
  return {
    edition: toBigNumLike(edition.edition),
    key: edition.key as unknown as number,
    parent: String(edition.parent),
  };
}

export const EDITION_KEYS = {
  EditionV1: Key.EditionV1 as unknown as number,
  MasterEditionV1: Key.MasterEditionV1 as unknown as number,
  MasterEditionV2: Key.MasterEditionV2 as unknown as number,
};
