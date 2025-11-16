import { Address } from '@components/common/Address';
import { Slot } from '@components/common/Slot';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account, useFetchAccountInfo } from '@providers/accounts';
import { AddressLookupTableAccount } from '@solana/web3.js';
import { AddressLookupTableAccountInfo } from '@validators/accounts/address-lookup-table';
import { Button } from '@components/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@components/shared/ui/card';
import React from 'react';
import { RefreshCw } from 'react-feather';

export function AddressLookupTableAccountSection(
    params:
        | {
              account: Account;
              data: Uint8Array;
          }
        | {
              account: Account;
              lookupTableAccount: AddressLookupTableAccountInfo;
          }
) {
    const account = params.account;
    const lookupTableState = React.useMemo(() => {
        if ('data' in params) {
            return AddressLookupTableAccount.deserialize(params.data);
        } else {
            return params.lookupTableAccount;
        }
    }, [params]);
    const lookupTableAccount = new AddressLookupTableAccount({
        key: account.pubkey,
        state: lookupTableState,
    });
    const refresh = useFetchAccountInfo();
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Address Lookup Table Account</CardTitle>
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
                    <td className="lg:text-right uppercase">
                        <SolBalance lamports={account.lamports} />
                    </td>
                </tr>
                <tr>
                    <td>Activation Status</td>
                    <td className="lg:text-right uppercase">
                        {lookupTableAccount.isActive() ? 'Active' : 'Deactivated'}
                    </td>
                </tr>
                <tr>
                    <td>Last Extended Slot</td>
                    <td className="lg:text-right">
                        {lookupTableAccount.state.lastExtendedSlot === 0 ? (
                            'None (Empty)'
                        ) : (
                            <Slot slot={lookupTableAccount.state.lastExtendedSlot} link />
                        )}
                    </td>
                </tr>
                <tr>
                    <td>Authority</td>
                    <td className="lg:text-right">
                        {lookupTableAccount.state.authority === undefined ? (
                            'None (Frozen)'
                        ) : (
                            <Address pubkey={lookupTableAccount.state.authority} alignRight link />
                        )}
                    </td>
                </tr>
                </TableCardBody>
            </CardContent>
        </Card>
    );
}
