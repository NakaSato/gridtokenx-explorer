import { Connection, PublicKey } from '@solana/web3.js';

import {
  decodeEdition,
  decodeMasterEdition,
  EDITION_KEYS,
  EditionInfoData,
  getEditionPda,
  MasterEditionInfo,
  NFTMetadata,
} from './metaplexMetadata';

export type EditionInfo = {
  masterEdition?: MasterEditionInfo;
  edition?: EditionInfoData;
};

export default async function getEditionInfo(metadata: NFTMetadata, connection: Connection): Promise<EditionInfo> {
  try {
    const editionPda = getEditionPda(new PublicKey(metadata.mint));
    const account = await connection.getAccountInfo(editionPda);
    if (!account || account.data.length === 0) {
      return { edition: undefined, masterEdition: undefined };
    }

    const key = account.data[0];
    if (key === EDITION_KEYS.MasterEditionV1 || key === EDITION_KEYS.MasterEditionV2) {
      return {
        edition: undefined,
        masterEdition: decodeMasterEdition(account.data),
      };
    }

    if (key === EDITION_KEYS.EditionV1) {
      const edition = decodeEdition(account.data);
      let masterEdition: MasterEditionInfo | undefined;
      try {
        const parentAccount = await connection.getAccountInfo(new PublicKey(edition.parent));
        if (parentAccount && parentAccount.data.length > 0) {
          masterEdition = decodeMasterEdition(parentAccount.data);
        }
      } catch (err) {
        // parent master edition unavailable — show edition info alone
      }
      return { edition, masterEdition };
    }
  } catch (err) {
    // no edition account or decode failure — treat as no edition info
  }

  return { edition: undefined, masterEdition: undefined };
}
