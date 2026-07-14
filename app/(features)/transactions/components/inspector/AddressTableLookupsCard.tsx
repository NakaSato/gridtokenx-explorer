import { Address } from '@/app/(shared)/components/common/Address';
import { useAddressLookupTable } from '@/app/(core)/providers/accounts';
import { FetchStatus } from '@/app/(core)/providers/cache';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import React from 'react';

export function AddressTableLookupsCard({ message }: { message: VersionedMessage }) {
  const [expanded, setExpanded] = React.useState(true);

  const lookupRows = React.useMemo(() => {
    return message.addressTableLookups.flatMap(lookup => {
      const indexes = [
        ...lookup.writableIndexes.map(index => ({ index, readOnly: false })),
        ...lookup.readonlyIndexes.map(index => ({ index, readOnly: true })),
      ];

      indexes.sort((a, b) => (a.index < b.index ? -1 : 1));

      return indexes.map(({ index, readOnly }) => {
        const props = {
          lookupTableIndex: index,
          lookupTableKey: lookup.accountKey,
          readOnly,
        };
        const key = `${lookup.accountKey.toBase58()}-${index}-${readOnly}`;
        return <LookupRow key={key} {...props} />;
      });
    });
  }, [message]);

  if (message.version === 'legacy') return null;

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Address Table Lookup(s)</h3>
        <button
          className={`flex items-center rounded-md px-3 py-1.5 text-sm ${expanded ? 'bg-primary text-primary-foreground' : 'border hover:bg-muted'}`}
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {expanded && (
        <div className="mb-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-muted-foreground">Address Lookup Table Address</th>
                <th className="text-muted-foreground">Table Index</th>
                <th className="text-muted-foreground">Resolved Address</th>
                <th className="text-muted-foreground">Details</th>
              </tr>
            </thead>
            {lookupRows.length > 0 ? (
              <tbody className="list">{lookupRows}</tbody>
            ) : (
              <tbody className="border-t px-6 py-4">
                <tr>
                  <td colSpan={4}>
                    <span className="text-muted-foreground text-center">No entries found</span>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

function LookupRow({
  lookupTableKey,
  lookupTableIndex,
  readOnly,
}: {
  lookupTableKey: PublicKey;
  lookupTableIndex: number;
  readOnly: boolean;
}) {
  const lookupTableInfo = useAddressLookupTable(lookupTableKey.toBase58());

  const loadingComponent = (
    <span className="text-muted-foreground">
      <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent align-middle"></span>
      Loading
    </span>
  );

  let resolvedKeyComponent;
  if (!lookupTableInfo) {
    resolvedKeyComponent = loadingComponent;
  } else {
    const [lookupTable, status] = lookupTableInfo;
    if (status === FetchStatus.Fetching) {
      resolvedKeyComponent = loadingComponent;
    } else if (status === FetchStatus.FetchFailed || !lookupTable) {
      resolvedKeyComponent = <span className="text-muted-foreground">Failed to fetch Lookup Table</span>;
    } else if (typeof lookupTable === 'string') {
      resolvedKeyComponent = <span className="text-muted-foreground">Invalid Lookup Table</span>;
    } else if (lookupTableIndex >= lookupTable.state.addresses.length) {
      resolvedKeyComponent = <span className="text-muted-foreground">Invalid Lookup Table Index</span>;
    } else {
      const resolvedKey = lookupTable.state.addresses[lookupTableIndex];
      resolvedKeyComponent = <Address pubkey={resolvedKey} link />;
    }
  }

  return (
    <tr>
      <td className="lg:text-right">
        <Address pubkey={lookupTableKey} link />
      </td>
      <td className="lg:text-right">{lookupTableIndex}</td>
      <td className="lg:text-right">{resolvedKeyComponent}</td>
      <td>
        {!readOnly && (
          <span className="mr-1 inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-800 dark:text-red-400">
            Writable
          </span>
        )}
      </td>
    </tr>
  );
}
