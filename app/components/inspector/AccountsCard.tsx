import { ErrorCard } from '@components/common/ErrorCard';
import { TableCardBody } from '@components/common/TableCardBody';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import React from 'react';

import { AddressFromLookupTableWithContext, AddressWithContext } from './AddressWithContext';

export function AccountsCard({ message }: { message: VersionedMessage }) {
  const [expanded, setExpanded] = React.useState(true);

  const { validMessage, error } = React.useMemo(() => {
    const { numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts } = message.header;

    if (numReadonlySignedAccounts >= numRequiredSignatures) {
      return { error: 'Invalid header', validMessage: undefined };
    } else if (numReadonlyUnsignedAccounts >= message.staticAccountKeys.length) {
      return { error: 'Invalid header', validMessage: undefined };
    } else if (message.staticAccountKeys.length === 0) {
      return { error: 'Message has no accounts', validMessage: undefined };
    }

    return {
      error: undefined,
      validMessage: message,
    };
  }, [message]);

  const { accountRows, numAccounts } = React.useMemo(() => {
    const message = validMessage;
    if (!message) return { accountRows: undefined, numAccounts: 0 };
    const staticAccountRows = message.staticAccountKeys.map((publicKey, accountIndex) => {
      const { numRequiredSignatures, numReadonlySignedAccounts, numReadonlyUnsignedAccounts } = message.header;

      let readOnly = false;
      let signer = false;
      if (accountIndex < numRequiredSignatures) {
        signer = true;
        if (accountIndex >= numRequiredSignatures - numReadonlySignedAccounts) {
          readOnly = true;
        }
      } else if (accountIndex >= message.staticAccountKeys.length - numReadonlyUnsignedAccounts) {
        readOnly = true;
      }

      const props = {
        accountIndex,
        publicKey,
        readOnly,
        signer,
      };

      return <AccountRow key={accountIndex} {...props} />;
    });

    let accountIndex = message.staticAccountKeys.length;
    const writableLookupTableRows = message.addressTableLookups.flatMap(lookup => {
      return lookup.writableIndexes.map(lookupTableIndex => {
        const props = {
          accountIndex,
          lookupTableIndex,
          lookupTableKey: lookup.accountKey,
          readOnly: false,
        };

        accountIndex += 1;
        return <AccountFromLookupTableRow key={accountIndex} {...props} />;
      });
    });

    const readonlyLookupTableRows = message.addressTableLookups.flatMap(lookup => {
      return lookup.readonlyIndexes.map(lookupTableIndex => {
        const props = {
          accountIndex,
          lookupTableIndex,
          lookupTableKey: lookup.accountKey,
          readOnly: true,
        };

        accountIndex += 1;
        return <AccountFromLookupTableRow key={accountIndex} {...props} />;
      });
    });

    return {
      accountRows: [...staticAccountRows, ...writableLookupTableRows, ...readonlyLookupTableRows],
      numAccounts: accountIndex,
    };
  }, [validMessage]);

  if (error) {
    return <ErrorCard text={`Unable to display accounts. ${error}`} />;
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h3 className="text-lg font-semibold">{`Account List (${numAccounts})`}</h3>
        <button
          className={`flex items-center rounded-md px-3 py-1.5 text-sm ${expanded ? 'bg-gray-800 text-white' : 'border hover:bg-gray-100'}`}
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {expanded && <TableCardBody>{accountRows}</TableCardBody>}
    </div>
  );
}

function AccountFromLookupTableRow({
  accountIndex,
  lookupTableKey,
  lookupTableIndex,
  readOnly,
}: {
  accountIndex: number;
  lookupTableKey: PublicKey;
  lookupTableIndex: number;
  readOnly: boolean;
}) {
  return (
    <tr>
      <td>
        <div className="flex flex-col items-start">
          Account #{accountIndex + 1}
          <span className="mt-1">
            {!readOnly && (
              <span className="mr-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                Writable
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
              Address Table Lookup
            </span>
          </span>
        </div>
      </td>
      <td className="lg:text-right">
        <AddressFromLookupTableWithContext lookupTableKey={lookupTableKey} lookupTableIndex={lookupTableIndex} />
      </td>
    </tr>
  );
}

function AccountRow({
  accountIndex,
  publicKey,
  signer,
  readOnly,
}: {
  accountIndex: number;
  publicKey: PublicKey;
  signer: boolean;
  readOnly: boolean;
}) {
  return (
    <tr>
      <td>
        <div className="d-flex align-items-start flex-column">
          Account #{accountIndex + 1}
          <span className="mt-1">
            {signer && (
              <span className="mr-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                Signer
              </span>
            )}
            {!readOnly && <span className="rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">Writable</span>}
          </span>
        </div>
      </td>
      <td className="lg:text-right">
        <AddressWithContext pubkey={publicKey} />
      </td>
    </tr>
  );
}
