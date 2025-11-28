import { AccountAddressRow, AccountBalanceRow, AccountHeader } from '@/app/(shared)/components/Account';
import { Address } from '@/app/(shared)/components/common/Address';
import { Slot } from '@/app/(shared)/components/common/Slot';
import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { Account, useFetchAccountInfo } from '@/app/(core)/providers/accounts';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { displayTimestamp } from '@/app/(shared)/utils/date';
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
                  <Address pubkey={voter.authorizedVoter} key={voter.authorizedVoter.toString()} alignRight raw link />
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
            <td className="font-mono lg:text-right">
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
