import { AccountAddressRow, AccountBalanceRow, AccountHeader } from '@components/common/Account';
import { Epoch } from '@components/common/Epoch';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account, useFetchAccountInfo } from '@providers/accounts';
import { displayTimestamp } from '@utils/date';
import {
    SysvarAccount,
    SysvarClockAccount,
    SysvarEpochScheduleAccount,
    SysvarFeesAccount,
    SysvarRecentBlockhashesAccount,
    SysvarRentAccount,
    SysvarRewardsAccount,
    SysvarSlotHashesAccount,
    SysvarSlotHistoryAccount,
    SysvarStakeHistoryAccount,
} from '@validators/accounts/sysvar';
import React from 'react';

export function SysvarAccountSection({ account, sysvarAccount }: { account: Account; sysvarAccount: SysvarAccount }) {
    switch (sysvarAccount.type) {
        case 'clock':
            return <SysvarAccountClockCard account={account} sysvarAccount={sysvarAccount} />;
        case 'rent':
            return <SysvarAccountRentCard account={account} sysvarAccount={sysvarAccount} />;
        case 'rewards':
            return <SysvarAccountRewardsCard account={account} sysvarAccount={sysvarAccount} />;
        case 'epochSchedule':
            return <SysvarAccountEpochScheduleCard account={account} sysvarAccount={sysvarAccount} />;
        case 'fees':
            return <SysvarAccountFeesCard account={account} sysvarAccount={sysvarAccount} />;
        case 'recentBlockhashes':
            return <SysvarAccountRecentBlockhashesCard account={account} sysvarAccount={sysvarAccount} />;
        case 'slotHashes':
            return <SysvarAccountSlotHashes account={account} sysvarAccount={sysvarAccount} />;
        case 'slotHistory':
            return <SysvarAccountSlotHistory account={account} sysvarAccount={sysvarAccount} />;
        case 'stakeHistory':
            return <SysvarAccountStakeHistory account={account} sysvarAccount={sysvarAccount} />;
    }
}

function SysvarAccountRecentBlockhashesCard({
    account,
}: {
    account: Account;
    sysvarAccount: SysvarRecentBlockhashesAccount;
}) {
    const refresh = useFetchAccountInfo();
    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <AccountHeader title="Sysvar: Recent Blockhashes" refresh={() => refresh(account.pubkey, 'parsed')} />

            <TableCardBody>
                <AccountAddressRow account={account} />
                <AccountBalanceRow account={account} />
            </TableCardBody>
        </div>
    );
}

function SysvarAccountSlotHashes({ account }: { account: Account; sysvarAccount: SysvarSlotHashesAccount }) {
    const refresh = useFetchAccountInfo();
    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <AccountHeader title="Sysvar: Slot Hashes" refresh={() => refresh(account.pubkey, 'parsed')} />

            <TableCardBody>
                <AccountAddressRow account={account} />
                <AccountBalanceRow account={account} />
            </TableCardBody>
        </div>
    );
}

function SysvarAccountSlotHistory({
    account,
    sysvarAccount,
}: {
    account: Account;
    sysvarAccount: SysvarSlotHistoryAccount;
}) {
    const refresh = useFetchAccountInfo();
    const history = Array.from(
        {
            length: 100,
        },
        (v, k) => sysvarAccount.info.nextSlot - k
    );
    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <AccountHeader title="Sysvar: Slot History" refresh={() => refresh(account.pubkey, 'parsed')} />

            <TableCardBody>
                <AccountAddressRow account={account} />
                <AccountBalanceRow account={account} />

                <tr>
                    <td className="align-top">
                        Slot History <span className="text-muted-foreground">(previous 100 slots)</span>
                    </td>
                    <td className="lg:text-right font-mono">
                        {history.map(val => (
                            <p key={val} className="mb-0">
                                <Slot slot={val} link />
                            </p>
                        ))}
                    </td>
                </tr>
            </TableCardBody>
        </div>
    );
}

function SysvarAccountStakeHistory({ account }: { account: Account; sysvarAccount: SysvarStakeHistoryAccount }) {
    const refresh = useFetchAccountInfo();
    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <AccountHeader title="Sysvar: Stake History" refresh={() => refresh(account.pubkey, 'parsed')} />

            <TableCardBody>
                <AccountAddressRow account={account} />
                <AccountBalanceRow account={account} />
            </TableCardBody>
        </div>
    );
}

function SysvarAccountFeesCard({ account, sysvarAccount }: { account: Account; sysvarAccount: SysvarFeesAccount }) {
    const refresh = useFetchAccountInfo();
    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <AccountHeader title="Sysvar: Fees" refresh={() => refresh(account.pubkey, 'parsed')} />

            <TableCardBody>
                <AccountAddressRow account={account} />
                <AccountBalanceRow account={account} />

                <tr>
                    <td>Lamports Per Signature</td>
                    <td className="lg:text-right">{sysvarAccount.info.feeCalculator.lamportsPerSignature}</td>
                </tr>
            </TableCardBody>
        </div>
    );
}

function SysvarAccountEpochScheduleCard({
    account,
    sysvarAccount,
}: {
    account: Account;
    sysvarAccount: SysvarEpochScheduleAccount;
}) {
    const refresh = useFetchAccountInfo();
    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <AccountHeader title="Sysvar: Epoch Schedule" refresh={() => refresh(account.pubkey, 'parsed')} />

            <TableCardBody>
                <AccountAddressRow account={account} />
                <AccountBalanceRow account={account} />

                <tr>
                    <td>Slots Per Epoch</td>
                    <td className="lg:text-right">{sysvarAccount.info.slotsPerEpoch}</td>
                </tr>

                <tr>
                    <td>Leader Schedule Slot Offset</td>
                    <td className="lg:text-right">{sysvarAccount.info.leaderScheduleSlotOffset}</td>
                </tr>

                <tr>
                    <td>Epoch Warmup Enabled</td>
                    <td className="lg:text-right">
                        <code>{sysvarAccount.info.warmup ? 'true' : 'false'}</code>
                    </td>
                </tr>

                <tr>
                    <td>First Normal Epoch</td>
                    <td className="lg:text-right">{sysvarAccount.info.firstNormalEpoch}</td>
                </tr>

                <tr>
                    <td>First Normal Slot</td>
                    <td className="lg:text-right">
                        <Slot slot={sysvarAccount.info.firstNormalSlot} />
                    </td>
                </tr>
            </TableCardBody>
        </div>
    );
}

function SysvarAccountClockCard({ account, sysvarAccount }: { account: Account; sysvarAccount: SysvarClockAccount }) {
    const refresh = useFetchAccountInfo();
    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <AccountHeader title="Sysvar: Clock" refresh={() => refresh(account.pubkey, 'parsed')} />

            <TableCardBody>
                <AccountAddressRow account={account} />
                <AccountBalanceRow account={account} />

                <tr>
                    <td>Timestamp</td>
                    <td className="lg:text-right font-mono">
                        {displayTimestamp(sysvarAccount.info.unixTimestamp * 1000)}
                    </td>
                </tr>

                <tr>
                    <td>Epoch</td>
                    <td className="lg:text-right">
                        <Epoch epoch={sysvarAccount.info.epoch} link />
                    </td>
                </tr>

                <tr>
                    <td>Leader Schedule Epoch</td>
                    <td className="lg:text-right">
                        <Epoch epoch={sysvarAccount.info.leaderScheduleEpoch} link />
                    </td>
                </tr>

                <tr>
                    <td>Slot</td>
                    <td className="lg:text-right">
                        <Slot slot={sysvarAccount.info.slot} link />
                    </td>
                </tr>
            </TableCardBody>
        </div>
    );
}

function SysvarAccountRentCard({ account, sysvarAccount }: { account: Account; sysvarAccount: SysvarRentAccount }) {
    const refresh = useFetchAccountInfo();
    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <AccountHeader title="Sysvar: Rent" refresh={() => refresh(account.pubkey, 'parsed')} />

            <TableCardBody>
                <AccountAddressRow account={account} />
                <AccountBalanceRow account={account} />

                <tr>
                    <td>Burn Percent</td>
                    <td className="lg:text-right">{sysvarAccount.info.burnPercent + '%'}</td>
                </tr>

                <tr>
                    <td>Exemption Threshold</td>
                    <td className="lg:text-right">{sysvarAccount.info.exemptionThreshold} years</td>
                </tr>

                <tr>
                    <td>Lamports Per Byte Year</td>
                    <td className="lg:text-right">{sysvarAccount.info.lamportsPerByteYear}</td>
                </tr>
            </TableCardBody>
        </div>
    );
}

function SysvarAccountRewardsCard({
    account,
    sysvarAccount,
}: {
    account: Account;
    sysvarAccount: SysvarRewardsAccount;
}) {
    const refresh = useFetchAccountInfo();

    const validatorPointValueFormatted = new Intl.NumberFormat('en-US', {
        maximumSignificantDigits: 20,
    }).format(sysvarAccount.info.validatorPointValue);

    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <AccountHeader title="Sysvar: Rewards" refresh={() => refresh(account.pubkey, 'parsed')} />

            <TableCardBody>
                <AccountAddressRow account={account} />
                <AccountBalanceRow account={account} />

                <tr>
                    <td>Validator Point Value</td>
                    <td className="lg:text-right font-mono">{validatorPointValueFormatted} lamports</td>
                </tr>
            </TableCardBody>
        </div>
    );
}
