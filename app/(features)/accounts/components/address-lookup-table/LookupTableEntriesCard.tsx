import { Address } from '@/app/(shared)/components/common/Address';
import { AddressLookupTableAccount, PublicKey } from '@solana/web3.js';
import { AddressLookupTableAccountInfo } from '@validators/accounts/address-lookup-table';
import React from 'react';

export function LookupTableEntriesCard(
  params:
    | {
        parsedLookupTable: AddressLookupTableAccountInfo;
      }
    | {
        lookupTableAccountData: Uint8Array;
      },
) {
  const lookupTableState = React.useMemo(() => {
    if ('lookupTableAccountData' in params) {
      return AddressLookupTableAccount.deserialize(params.lookupTableAccountData);
    } else {
      return params.parsedLookupTable;
    }
  }, [params]);

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="border-b px-6 py-4">
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Lookup Table Entries</h3>
          </div>
        </div>
      </div>

      <div className="mb-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-muted-foreground w-1">Index</th>
              <th className="text-muted-foreground">Address</th>
            </tr>
          </thead>
          <tbody className="list">
            {lookupTableState.addresses.length > 0 &&
              lookupTableState.addresses.map((entry: PublicKey, index) => {
                return renderRow(entry, index);
              })}
          </tbody>
        </table>
      </div>

      {lookupTableState.addresses.length === 0 && (
        <div className="border-t px-6 py-4">
          <div className="text-muted-foreground text-center">No entries found</div>
        </div>
      )}
    </div>
  );
}

const renderRow = (entry: PublicKey, index: number) => {
  return (
    <tr key={index}>
      <td className="w-1 font-mono">{index}</td>
      <td className="font-mono">
        <Address pubkey={entry} link />
      </td>
    </tr>
  );
};
