import { SolBalance } from '@components/common/SolBalance';
import { Account } from '@providers/accounts';
import React from 'react';
import { RefreshCw } from 'react-feather';

import { Address } from './Address';

type AccountHeaderProps = {
    title: string;
    refresh: () => void;
};

type AccountProps = {
    account: Account;
};

export function AccountHeader({ title, refresh }: AccountHeaderProps) {
    return (
        <div className="px-6 py-4 border-b flex items-center">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button className="bg-white text-black border px-3 py-1.5 rounded-md hover:bg-gray-100 text-sm" onClick={() => refresh()}>
                <RefreshCw className="align-text-top mr-2" size={13} />
                Refresh
            </button>
        </div>
    );
}

export function AccountAddressRow({ account }: AccountProps) {
    return (
        <tr>
            <td>Address</td>
            <td className="lg:text-right">
                <Address pubkey={account.pubkey} alignRight raw />
            </td>
        </tr>
    );
}

export function AccountBalanceRow({ account }: AccountProps) {
    const { lamports } = account;
    return (
        <tr>
            <td>Balance (SOL)</td>
            <td className="lg:text-right uppercase">
                <SolBalance lamports={lamports} />
            </td>
        </tr>
    );
}
