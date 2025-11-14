// import { programs } from '@metaplex/js';
import { Connection } from '@solana/web3.js';

// const {
//     metadata: { Metadata, MasterEdition, MetadataKey },
// } = programs;

// type MasterEditionData = programs.metadata.MasterEditionV1Data | programs.metadata.MasterEditionV2Data;
// type EditionData = programs.metadata.EditionData;

export type EditionInfo = {
    masterEdition?: any;
    edition?: any;
};

export default async function getEditionInfo(
    metadata: any,
    connection: Connection
): Promise<EditionInfo> {
    // TODO: Rimplement with new Metaplex SDK
    return {
        edition: undefined,
        masterEdition: undefined,
    };
}
