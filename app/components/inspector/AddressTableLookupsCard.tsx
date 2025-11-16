import { Address } from '@components/common/Address';
import { useAddressLookupTable } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import React from 'react';

export function AddressTableLookupsCard({ message }: { message: VersionedMessage }) {
    const [expanded, setExpanded] = React.useState(true);

    const lookupRows = React.useMemo(() => {
        let key = 0;
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
                return <LookupRow key={key++} {...props} />;
            });
        });
    }, [message]);

    if (message.version === 'legacy') return null;

    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Address Table Lookup(s)</h3>
                <button
                    className={`btn btn-sm d-flex ${expanded ? 'btn-black active' : 'btn-white'}`}
                    onClick={() => setExpanded(e => !e)}
                >
                    {expanded ? 'Collapse' : 'Expand'}
                </button>
            </div>
            {expanded && (
                <div className="overflow-x-auto mb-0">
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
                            <tbody className="px-6 py-4 border-t">
                                <tr>
                                    <td colSpan={4}>
                                        <span className="text-muted text-center">No entries found</span>
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
            <span className="spinner-grow spinner-grow-sm m2"></span>
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
            <td>{!readOnly && <span className="badge bg-danger-soft m1">Writable</span>}</td>
        </tr>
    );
}
