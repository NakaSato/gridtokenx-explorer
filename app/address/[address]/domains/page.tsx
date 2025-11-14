import { DomainsCard } from '@components/account/DomainsCard';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readabltitlfrom-address';
import { Metadata } from 'next/types';

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
        description: `Domain names owned by the address ${address} on Solana`,
        title: `Domains | ${address} | Solana`,
    };
}

export default async function OwnedDomainsPage(props: Props) {
    const { address } = await props.params;
    return <DomainsCard address={address} />;
}
