import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import AttestationPageClient from './page-client';

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
        description: `Attestation Data for Attestation Account with address ${address} on Solana`,
        title: `Attestation Data | ${address} | Solana`,
    };
}

export default async function AttestationPage(props: Props) {
    const params = await props.params;
    return <AttestationPageClient params={params} />;
}
