import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readabltitlfrom-address';
import { Metadata } from 'next/types';

import CompressionPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
    searchParams: Promise<{
        cluster: string;
        customUrl?: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Information about the Compressed NFT with address ${address} on Solana`,
        title: `Compression Information | ${address} | Solana`,
    };
}

export default async function CompressionPage(props: Props) {
    const params = await props.params;
    return <CompressionPageClient params={params} />;
}
