import { Address } from '@/app/(shared)/components/common/Address';
import { Epoch } from '@/app/(shared)/components/common/Epoch';
import { SolBalance } from '@/app/(shared)/components/common/SolBalance';
import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { Account, useFetchAccountInfo } from '@/app/(core)/providers/accounts';
import { StakeActivationData } from '@solana/web3.js';
import { displayTimestampUtc } from '@/app/(shared)/utils/date';
import { StakeAccountInfo, StakeAccountType, StakeMeta } from '@validators/accounts/stake';
import { Button } from '@/app/(shared)/components/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/(shared)/components/shared/ui/card';
import React from 'react';
import { RefreshCw } from 'react-feather';

const U64_MAX = BigInt('0xffffffffffffffff');

export function StakeAccountSection({
  account,
  stakeAccount,
  activation,
  stakeAccountType,
}: {
  account: Account;
  stakeAccount: StakeAccountInfo;
  stakeAccountType: StakeAccountType;
  activation?: StakeActivationData;
}) {
  const hideDelegation = stakeAccountType !== 'delegated' || isFullyInactivated(stakeAccount, activation);
  return (
    <>
      <LockupCard stakeAccount={stakeAccount} />
      <OverviewCard
        account={account}
        stakeAccount={stakeAccount}
        stakeAccountType={stakeAccountType}
        activation={activation}
        hideDelegation={hideDelegation}
      />
      {!hideDelegation && (
        <DelegationCard stakeAccount={stakeAccount} activation={activation} stakeAccountType={stakeAccountType} />
      )}
      <AuthoritiesCard meta={stakeAccount.meta} />
    </>
  );
}

function LockupCard({ stakeAccount }: { stakeAccount: StakeAccountInfo }) {
  const unixTimestamp = 1000 * (stakeAccount.meta?.lockup.unixTimestamp || 0);
  if (Date.now() < unixTimestamp) {
    const prettyTimestamp = displayTimestampUtc(unixTimestamp);
    return (
      <Card className="border-yellow-200 bg-yellow-50 text-yellow-800">
        <CardContent className="px-4 py-3 text-center">
          <strong>Account is locked!</strong> Lockup expires on {prettyTimestamp}
        </CardContent>
      </Card>
    );
  } else {
    return null;
  }
}

const TYPE_NAMES = {
  delegated: 'Delegated',
  initialized: 'Initialized',
  rewardsPool: 'RewardsPool',
  uninitialized: 'Uninitialized',
};

function displayStatus(stakeAccountType: StakeAccountType, activation?: StakeActivationData) {
  let status = TYPE_NAMES[stakeAccountType];
  let activationState = '';
  if (stakeAccountType !== 'delegated') {
    status = 'Not delegated';
  } else {
    activationState = activation ? `(${activation.state})` : '';
  }

  return [status, activationState].join(' ');
}

function OverviewCard({
  account,
  stakeAccount,
  stakeAccountType,
  activation,
  hideDelegation,
}: {
  account: Account;
  stakeAccount: StakeAccountInfo;
  stakeAccountType: StakeAccountType;
  activation?: StakeActivationData;
  hideDelegation: boolean;
}) {
  const refresh = useFetchAccountInfo();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Stake Account</CardTitle>
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
          <tr>
            <td>Rent Reserve (SOL)</td>
            <td className="lg:text-right">
              <SolBalance lamports={stakeAccount.meta.rentExemptReserve} />
            </td>
          </tr>
          {hideDelegation && (
            <tr>
              <td>Status</td>
              <td className="lg:text-right">
                {isFullyInactivated(stakeAccount, activation)
                  ? 'Not delegated'
                  : displayStatus(stakeAccountType, activation)}
              </td>
            </tr>
          )}
        </TableCardBody>
      </CardContent>
    </Card>
  );
}

function DelegationCard({
  stakeAccount,
  stakeAccountType,
  activation,
}: {
  stakeAccount: StakeAccountInfo;
  stakeAccountType: StakeAccountType;
  activation?: StakeActivationData;
}) {
  let voterPubkey, activationEpoch, deactivationEpoch;
  const delegation = stakeAccount?.stake?.delegation;
  if (delegation) {
    voterPubkey = delegation.voter;
    if (delegation.activationEpoch !== U64_MAX) {
      activationEpoch = delegation.activationEpoch;
    }
    if (delegation.deactivationEpoch !== U64_MAX) {
      deactivationEpoch = delegation.deactivationEpoch;
    }
  }
  const { stake } = stakeAccount;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Stake Delegation</CardTitle>
      </CardHeader>
      <CardContent>
        <TableCardBody>
          <tr>
            <td>Status</td>
            <td className="lg:text-right">{displayStatus(stakeAccountType, activation)}</td>
          </tr>

          {stake && (
            <>
              <tr>
                <td>Delegated Stake (SOL)</td>
                <td className="lg:text-right">
                  <SolBalance lamports={stake.delegation.stake} />
                </td>
              </tr>

              {activation && (
                <>
                  <tr>
                    <td>Active Stake (SOL)</td>
                    <td className="lg:text-right">
                      <SolBalance lamports={activation.active} />
                    </td>
                  </tr>

                  <tr>
                    <td>Inactive Stake (SOL)</td>
                    <td className="lg:text-right">
                      <SolBalance lamports={activation.inactive} />
                    </td>
                  </tr>
                </>
              )}

              {voterPubkey && (
                <tr>
                  <td>Delegated Vote Address</td>
                  <td className="lg:text-right">
                    <Address pubkey={voterPubkey} alignRight link />
                  </td>
                </tr>
              )}

              <tr>
                <td>Activation Epoch</td>
                <td className="lg:text-right">
                  {activationEpoch !== undefined ? <Epoch epoch={activationEpoch} link /> : '-'}
                </td>
              </tr>
              <tr>
                <td>Deactivation Epoch</td>
                <td className="lg:text-right">
                  {deactivationEpoch !== undefined ? <Epoch epoch={deactivationEpoch} link /> : '-'}
                </td>
              </tr>
            </>
          )}
        </TableCardBody>
      </CardContent>
    </Card>
  );
}

function AuthoritiesCard({ meta }: { meta: StakeMeta }) {
  const hasLockup = meta.lockup.unixTimestamp > 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Authorities</CardTitle>
      </CardHeader>
      <CardContent>
        <TableCardBody>
          <tr>
            <td>Stake Authority Address</td>
            <td className="lg:text-right">
              <Address pubkey={meta.authorized.staker} alignRight link />
            </td>
          </tr>

          <tr>
            <td>Withdraw Authority Address</td>
            <td className="lg:text-right">
              <Address pubkey={meta.authorized.withdrawer} alignRight link />
            </td>
          </tr>

          {hasLockup && (
            <tr>
              <td>Lockup Authority Address</td>
              <td className="lg:text-right">
                <Address pubkey={meta.lockup.custodian} alignRight link />
              </td>
            </tr>
          )}
        </TableCardBody>
      </CardContent>
    </Card>
  );
}

function isFullyInactivated(stakeAccount: StakeAccountInfo, activation?: StakeActivationData): boolean {
  const { stake } = stakeAccount;

  if (!stake || !activation) {
    return false;
  }

  const delegatedStake = stake.delegation.stake;
  const inactiveStake = BigInt(activation.inactive);

  return stake.delegation.deactivationEpoch !== U64_MAX && delegatedStake === inactiveStake;
}
