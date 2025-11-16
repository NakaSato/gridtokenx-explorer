'use client';

import { Address } from '@components/common/Address';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { useUserDomains } from '@utils/name-service';
import React from 'react';

import { DomainInfo } from '@/app/utils/domain-info';

import { useUserANSDomains } from '../../utils/ans-domains';

export function DomainsCard({ address }: { address: string }) {
    const [domains, domainsLoading] = useUserDomains(address);
    const [domainsANS, domainsANSLoading] = useUserANSDomains(address);

    if (
        (domainsLoading && (!domains || domains.length === 0)) ||
        (domainsANSLoading && (!domainsANS || domainsANS.length === 0))
    ) {
        return <LoadingCard message="Loading domains" />;
    } else if (!domains || !domainsANS) {
        return <ErrorCard text="Failed to fetch domains" />;
    }

    if (domains.length === 0 && domainsANS.length === 0) {
        return <ErrorCard text="No domain name found" />;
    }

    let allDomains = domains;

    if (domainsANS) {
        allDomains = [...allDomains, ...domainsANS];
    }

    allDomains.sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b flex items-center">
                <h3 className="text-lg font-semibold">Owned Domain Names</h3>
            </div>
            <div className="overflow-x-auto mb-0">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-muted-foreground">Domain Name</th>
                            <th className="text-muted-foreground">Name Service Account</th>
                        </tr>
                    </thead>
                    <tbody className="list">
                        {allDomains.map(domain => (
                            <RenderDomainRow key={domain.address.toBase58()} domainInfo={domain} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function RenderDomainRow({ domainInfo }: { domainInfo: DomainInfo }) {
    return (
        <tr>
            <td>{domainInfo.name}</td>
            <td>
                <Address pubkey={domainInfo.address} link />
            </td>
        </tr>
    );
}
