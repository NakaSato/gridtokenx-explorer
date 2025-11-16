import { AccountAddressRow, AccountBalanceRow, AccountHeader } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account, useFetchAccountInfo } from '@providers/accounts';
import { Card, CardContent } from '@components/shared/ui/card';
import { displayTimestamp } from '@utils/date';
import { VoteAccount } from '@validators/accounts/vote';
import React from 'react';

export function VoteAccountSection({ account, voteAccount }: { account: Account; voteAccount: VoteAccount }) {
    const refresh = useFetchAccountInfo();
    const rootSlot = voteAccount.info.rootSlot;
    return (
        <Card>
            <AccountHeader title="Vote Account" refresh={() => refresh(account.pubkey, 'parsed')} />

            <CardContent>
                <TableCardBody>
                    <AccountAddressRow account={account} />
                    <AccountBalanceRow account={account} />

                    <tr>
                        <td>
                            Authorized Voter
                            {voteAccount.info.authorizedVoters.length > 1 ? 's' : ''}
                        </td>
                        <td className="lg:text-right">
                            {voteAccount.info.authorizedVoters.map(voter => {
                                return (
                                    <Address
                                        pubkey={voter.authorizedVoter}
                                        key={voter.authorizedVoter.toString()}
                                        alignRight
                                        raw
                                        link
                                    />
                                );
                            })}
                        </td>
                    </tr>

                    <tr>
                        <td>Authorized Withdrawer</td>
                        <td className="lg:text-right">
                            <Address pubkey={voteAccount.info.authorizedWithdrawer} alignRight raw link />
                        </td>
                    </tr>

                    <tr>
                        <td>Last Timestamp</td>
                        <td className="lg:text-right font-mono">
                            {displayTimestamp(voteAccount.info.lastTimestamp.timestamp * 1000)}
                        </td>
                    </tr>

                    <tr>
                        <td>Commission</td>
                        <td className="lg:text-right">{voteAccount.info.commission + '%'}</td>
                    </tr>

                    <tr>
                        <td>Root Slot</td>
                        <td className="lg:text-right">{rootSlot !== null ? <Slot slot={rootSlot} link /> : 'N/A'}</td>
                    </tr>
                </TableCardBody>
            </CardContent>
        </Card>
    );
}
