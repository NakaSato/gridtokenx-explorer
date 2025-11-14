import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import AnchorAccountPageClient from './page-client';

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
    const params = await props.params;
    return {
        description: `Contents of Anchor Account at address ${params.address} on Solana`,
        title: `Anchor Account Data | ${params.address} | Solana`,
    };
}

export default async function AnchorAccountPage(props: Props) {
    const params = await props.params;
    return <AnchorAccountPageClient params={params} />;
}
