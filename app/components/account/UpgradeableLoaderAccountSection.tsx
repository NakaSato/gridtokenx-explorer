import { UnknownAccountCard } from '@components/account/UnknownAccountCard';
import { Address } from '@components/common/Address';
import { DownloadableIcon } from '@components/common/Downloadable';
import { InfoTooltip } from '@components/common/InfoTooltip';
import { Slot } from '@components/common/Slot';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account, useFetchAccountInfo } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { addressLabel } from '@utils/tx';
import {
    ProgramAccountInfo,
    ProgramBufferAccountInfo,
    ProgramDataAccountInfo,
    UpgradeableLoaderAccount,
} from '@validators/accounts/upgradeable-program';
import { Button } from '@components/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@components/shared/ui/card';
import Link from 'next/link';
import React from 'react';
import { ExternalLink, RefreshCw } from 'react-feather';

import { ProgramSecurityTXTBadge } from '@/app/features/security-txt/ui/SecurityTXTBadge';
import { ProgramSecurityTXTLabel } from '@/app/features/security-txt/ui/SecurityTXTLabel';
import { useSquadsMultisigLookup } from '@/app/providers/squadsMultisig';
import { Cluster } from '@/app/utils/cluster';
import { useClusterPath } from '@/app/utils/url';

import { VerifiedProgramBadge } from '../common/VerifiedProgramBadge';

export function UpgradeableLoaderAccountSection({
    account,
    parsedData,
    programData,
}: {
    account: Account;
    parsedData: UpgradeableLoaderAccount;
    programData: ProgramDataAccountInfo | undefined;
}) {
    switch (parsedData.type) {
        case 'program': {
            return (
                <UpgradeableProgramSection
                    account={account}
                    programAccount={parsedData.info}
                    programData={programData}
                />
            );
        }
        case 'programData': {
            return <UpgradeableProgramDataSection account={account} programData={parsedData.info} />;
        }
        case 'buffer': {
            return <UpgradeableProgramBufferSection account={account} programBuffer={parsedData.info} />;
        }
        case 'uninitialized': {
            return <UnknownAccountCard account={account} />;
        }
    }
}

export function UpgradeableProgramSection({
    account,
    programAccount,
    programData,
}: {
    account: Account;
    programAccount: ProgramAccountInfo;
    programData: ProgramDataAccountInfo | undefined;
}) {
    const refresh = useFetchAccountInfo();
    const { cluster } = useCluster();
    const { data: squadMapInfo } = useSquadsMultisigLookup(programData?.authority, cluster);

    const label = addressLabel(account.pubkey.toBase58(), cluster);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        {programData === undefined && 'Closed '}Program Account
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refresh(account.pubkey, 'parsed')}>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <TableCardBody>
                    <tr>
                        <td>Address</td>
                        <td className="lg:text-right">
                            <Address pubkey={account.pubkey} alignRight raw />
                        </td>
                    </tr>
                    {label && (
                        <tr>
                            <td>Address Label</td>
                            <td className="lg:text-right">{label}</td>
                        </tr>
                    )}
                    <tr>
                        <td>Balance (SOL)</td>
                        <td className="uppercase lg:text-right">
                            <SolBalance lamports={account.lamports} />
                        </td>
                    </tr>
                    <tr>
                        <td>Executable</td>
                        <td className="lg:text-right">{programData !== undefined ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr>
                        <td>Executable Data{programData === undefined && ' (Closed)'}</td>
                        <td className="lg:text-right">
                            <Address pubkey={programAccount.programData} alignRight link />
                        </td>
                    </tr>
                    {programData !== undefined && (
                        <>
                            <tr>
                                <td>Upgradeable</td>
                                <td className="lg:text-right">{programData.authority !== null ? 'Yes' : 'No'}</td>
                            </tr>
                            <tr>
                                <td>
                                    <VerifiedLabel />
                                </td>
                                <td className="lg:text-right">
                                    <VerifiedProgramBadge programData={programData} pubkey={account.pubkey} />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <ProgramSecurityTXTLabel programPubkey={account.pubkey} />
                                </td>
                                <td className="lg:text-right">
                                    <ProgramSecurityTXTBadge programData={programData} programPubkey={account.pubkey} />
                                </td>
                            </tr>
                            <tr>
                                <td>Last Deployed Slot</td>
                                <td className="lg:text-right">
                                    <Slot slot={programData.slot} link />
                                </td>
                            </tr>
                            {programData.authority !== null && (
                                <>
                                    <tr>
                                        <td>Upgrade Authority</td>
                                        <td className="lg:text-right">
                                            {cluster == Cluster.MainnetBeta && squadMapInfo?.isSquad ? (
                                                <MultisigBadge pubkey={account.pubkey} />
                                            ) : null}
                                            <Address pubkey={programData.authority} alignRight link />
                                        </td>
                                    </tr>
                                </>
                            )}
                        </>
                    )}
                </TableCardBody>
            </CardContent>
        </Card>
    );
}

function MultisigBadge({ pubkey }: { pubkey: PublicKey }) {
    const programMultisigTabPath = useClusterPath({ pathname: `/address/${pubkey.toBase58()}/program-multisig` });
    return (
        <Link
            className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
            href={programMultisigTabPath}
        >
            Program Multisig
        </Link>
    );
}

function VerifiedLabel() {
    return (
        <InfoTooltip text="Verified builds allow users can ensure that hash of on-chain program matches the hash of the program of given codebase (registry hosted by osec.io).">
            <Link
                rel="noopener noreferrer"
                target="_blank"
                href="https://github.com/Ellipsis-Labs/solana-verifiable-build"
            >
                <span className="security-txt-link-color-hack-reee">Verified Build</span>
                <ExternalLink className="ml-2 align-text-top" size={13} />
            </Link>
        </InfoTooltip>
    );
}

export function UpgradeableProgramDataSection({
    account,
    programData,
}: {
    account: Account;
    programData: ProgramDataAccountInfo;
}) {
    const refresh = useFetchAccountInfo();
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Program Executable Data Account</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refresh(account.pubkey, 'parsed')}>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <TableCardBody>
                    <tr>
                        <td>Address</td>
                        <td className="lg:text-right">
                            <Address pubkey={account.pubkey} alignRight raw />
                        </td>
                    </tr>
                    <tr>
                        <td>Balance (SOL)</td>
                        <td className="uppercase lg:text-right">
                            <SolBalance lamports={account.lamports} />
                        </td>
                    </tr>
                    {account.space !== undefined && (
                        <tr>
                            <td>Data Size (Bytes)</td>
                            <td className="lg:text-right">
                                <DownloadableIcon data={programData.data[0]} filename={`${account.pubkey.toString()}.bin`}>
                                    <span className="mr-2">{account.space}</span>
                                </DownloadableIcon>
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td>Upgradeable</td>
                        <td className="lg:text-right">{programData.authority !== null ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr>
                        <td>Last Deployed Slot</td>
                        <td className="lg:text-right">
                            <Slot slot={programData.slot} link />
                        </td>
                    </tr>
                    {programData.authority !== null && (
                        <tr>
                            <td>Upgrade Authority</td>
                            <td className="lg:text-right">
                                <Address pubkey={programData.authority} alignRight link />
                            </td>
                        </tr>
                    )}
                </TableCardBody>
            </CardContent>
        </Card>
    );
}

export function UpgradeableProgramBufferSection({
    account,
    programBuffer,
}: {
    account: Account;
    programBuffer: ProgramBufferAccountInfo;
}) {
    const refresh = useFetchAccountInfo();
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Program Deploy Buffer Account</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refresh(account.pubkey, 'parsed')}>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <TableCardBody>
                    <tr>
                        <td>Address</td>
                        <td className="lg:text-right">
                            <Address pubkey={account.pubkey} alignRight raw />
                        </td>
                    </tr>
                    <tr>
                        <td>Balance (SOL)</td>
                        <td className="uppercase lg:text-right">
                            <SolBalance lamports={account.lamports} />
                        </td>
                    </tr>
                    {account.space !== undefined && (
                        <tr>
                            <td>Data Size (Bytes)</td>
                            <td className="lg:text-right">{account.space}</td>
                        </tr>
                    )}
                    {programBuffer.authority !== null && (
                        <tr>
                            <td>Deploy Authority</td>
                            <td className="lg:text-right">
                                <Address pubkey={programBuffer.authority} alignRight link />
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td>Owner</td>
                        <td className="lg:text-right">
                            <Address pubkey={account.owner} alignRight link />
                        </td>
                    </tr>
                </TableCardBody>
            </CardContent>
        </Card>
    );
}
