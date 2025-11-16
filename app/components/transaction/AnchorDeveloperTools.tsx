'use client';

import { Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

interface AnchorDeveloperToolsProps {
    programId: string;
    clusterUrl: string;
}

export function AnchorDeveloperTools({ programId, clusterUrl }: AnchorDeveloperToolsProps) {
    const [idlData, setIdlData] = React.useState<any | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [manualIdl, setManualIdl] = React.useState<string>('');
    const [showIdlInput, setShowIdlInput] = React.useState(false);

    const fetchIdl = React.useCallback(async () => {
        if (!programId) return;

        setLoading(true);
        setError(null);

        try {
            // Use the API route instead of client-side NodeWallet
            // The API expects a cluster parameter, but we need to determine the cluster type
            // For now, we'll use a generic approach since the API can handle different cluster URLs
            const response = await fetch(`/api/anchor?cluster=${encodeURIComponent(clusterUrl)}&programAddress=${encodeURIComponent(programId)}`);
            const data = await response.json();

            if (response.ok && data.idl) {
                setIdlData(data.idl);
                setError(null);
            } else {
                setError('IDL not found on-chain. You can manually paste your IDL below.');
            }
        } catch (err) {
            console.error('Error fetching IDL:', err);
            setError('Failed to fetch IDL. For localhost, you can manually paste your IDL below.');
        } finally {
            setLoading(false);
        }
    }, [programId, clusterUrl]);

    const handleManualIdl = () => {
        try {
            const parsed = JSON.parse(manualIdl);
            setIdlData(parsed);
            setError(null);
            setShowIdlInput(false);
        } catch (err) {
            setError('Invalid JSON format. Please check your IDL.');
        }
    };

    React.useEffect(() => {
        if (programId) {
            fetchIdl();
        }
    }, [programId, fetchIdl]);

    if (!programId) {
        return (
            <div className="bg-card border rounded-lg shadow-sm">
                <div className="p-6">
                    <h5 className="text-lg font-semibold">Anchor Developer Tools</h5>
                    <p className="text-muted-foreground">Enter a program ID above to access Anchor developer tools.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border rounded-lg shadow-sm mb-4">
            <div className="px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h5 className="text-lg font-semibold mb-0">🔧 Anchor Developer Tools</h5>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            className="px-3 py-1.5 text-sm border border-primary text-primary rounded-md hover:bg-primary/10"
                            onClick={() => setShowIdlInput(!showIdlInput)}
                        >
                            {showIdlInput ? 'Hide' : 'Manual IDL'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="p-6">
                {loading && (
                    <div className="text-center py-4">
                        <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" role="status">
                            <span className="sr-only">Loading IDL...</span>
                        </div>
                        <p className="text-muted-foreground mt-2">Fetching IDL from program...</p>
                    </div>
                )}

                {error && !showIdlInput && (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
                        <strong>Note:</strong> {error}
                        <button className="px-3 py-1.5 text-sm border border-primary text-primary rounded-md hover:bg-primary/10 ml-3" onClick={() => setShowIdlInput(true)}>
                            Paste IDL Manually
                        </button>
                    </div>
                )}

                {showIdlInput && (
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-2">Paste Your Program IDL (JSON format):</label>
                        <textarea
                            className="w-full border rounded-md px-3 py-2 font-mono text-sm"
                            rows={10}
                            value={manualIdl}
                            onChange={e => setManualIdl(e.target.value)}
                            placeholder='{"version": "0.1.0", "name": "your_program", ...}'
                        />
                        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 mt-2" onClick={handleManualIdl}>
                            Load IDL
                        </button>
                    </div>
                )}

                {idlData && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="p-3 bg-gray-50 rounded">
                                    <h6 className="text-muted-foreground text-sm mb-1">Program Name</h6>
                                    <h4 className="text-xl font-bold mb-0">{idlData.name}</h4>
                                </div>
                            </div>
                            <div>
                                <div className="p-3 bg-gray-50 rounded">
                                    <h6 className="text-muted-foreground text-sm mb-1">IDL Version</h6>
                                    <h4 className="text-xl font-bold mb-0">{idlData.version}</h4>
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        {idlData.instructions && idlData.instructions.length > 0 && (
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2">📋 Instructions ({idlData.instructions.length})</h5>
                                <div className="accordion" id="instructionsDetails">
                                    {idlData.instructions.map((instruction: any, idx: number) => (
                                        <div key={idx} className="accordion-item">
                                            <h2 className="accordion-header">
                                                <button
                                                    className="accordion-button collapsed"
                                                    type="button"
                                                    data-bs-toggle="collapse"
                                                    data-bs-target={`#ix-${idx}`}
                                                >
                                                    <code className="mr-2">{instruction.name}</code>
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                        {instruction.accounts?.length || 0} accounts
                                                    </span>
                                                    <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs ml-2">
                                                        {instruction.args?.length || 0} args
                                                    </span>
                                                </button>
                                            </h2>
                                            <div
                                                id={`ix-${idx}`}
                                                className="accordion-collapse collapse"
                                                data-bs-parent="#instructionsDetails"
                                            >
                                                <div className="accordion-body">
                                                    {instruction.accounts && instruction.accounts.length > 0 && (
                                                        <div className="mb-3">
                                                            <h6 className="font-semibold mb-2">Accounts:</h6>
                                                            <ul className="space-y-2">
                                                                {instruction.accounts.map((account: any, i: number) => (
                                                                    <li key={i} className="border rounded px-3 py-2">
                                                                        <code>{account.name}</code>
                                                                        {account.isMut && (
                                                                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs ml-2">
                                                                                mut
                                                                            </span>
                                                                        )}
                                                                        {account.isSigner && (
                                                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs ml-2">
                                                                                signer
                                                                            </span>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {instruction.args && instruction.args.length > 0 && (
                                                        <div>
                                                            <h6 className="font-semibold mb-2">Arguments:</h6>
                                                            <ul className="space-y-2">
                                                                {instruction.args.map((arg: any, i: number) => (
                                                                    <li key={i} className="border rounded px-3 py-2">
                                                                        <code>{arg.name}</code>
                                                                        <span className="text-muted-foreground ml-2">
                                                                            : {JSON.stringify(arg.type)}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Accounts/State */}
                        {idlData.accounts && idlData.accounts.length > 0 && (
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2">💾 Account Types ({idlData.accounts.length})</h5>
                                <div className="accordion" id="accountsDetails">
                                    {idlData.accounts.map((account: any, idx: number) => (
                                        <div key={idx} className="accordion-item">
                                            <h2 className="accordion-header">
                                                <button
                                                    className="accordion-button collapsed"
                                                    type="button"
                                                    data-bs-toggle="collapse"
                                                    data-bs-target={`#acc-${idx}`}
                                                >
                                                    <code>{account.name}</code>
                                                </button>
                                            </h2>
                                            <div
                                                id={`acc-${idx}`}
                                                className="accordion-collapse collapse"
                                                data-bs-parent="#accountsDetails"
                                            >
                                                <div className="accordion-body">
                                                    <pre className="bg-gray-50 p-2 rounded">
                                                        {JSON.stringify(account.type, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Events */}
                        {idlData.events && idlData.events.length > 0 && (
                            <div className="mb-4">
                                <h5 className="border-bottom pb-2">📡 Events ({idlData.events.length})</h5>
                                <div className="list-group">
                                    {idlData.events.map((event: any, idx: number) => (
                                        <div key={idx} className="list-group-item">
                                            <h6>
                                                <code>{event.name}</code>
                                            </h6>
                                            <pre className="bg-gray-50 p-2 rounded mb-0">
                                                {JSON.stringify(event.fields, null, 2)}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Errors */}
                        {idlData.errors && idlData.errors.length > 0 && (
                            <div className="mb-4">
                                <h5 className="border-b pb-2">⚠️ Error Codes ({idlData.errors.length})</h5>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Name</th>
                                                <th>Message</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {idlData.errors.map((error: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <code>{error.code}</code>
                                                    </td>
                                                    <td>
                                                        <code>{error.name}</code>
                                                    </td>
                                                    <td>{error.msg}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Full IDL Download */}
                        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
                            <div className="flex justify-between items-center">
                                <span>
                                    <strong>Developer Tip:</strong> You can download the full IDL for offline use
                                </span>
                                <button
                                    className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                    onClick={() => {
                                        const blob = new Blob([JSON.stringify(idlData, null, 2)], {
                                            type: 'application/json',
                                        });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `${idlData.name}-idl.json`;
                                        a.click();
                                    }}
                                >
                                    Download IDL
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
