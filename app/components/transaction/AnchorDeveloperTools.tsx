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
            const { Program, AnchorProvider } = await import('@coral-xyz/anchor');
            const { Connection, Keypair } = await import('@solana/web3.js');
            const NodeWallet = (await import('@coral-xyz/anchor/dist/cjs/nodewallet')).default;

            const connection = new Connection(clusterUrl);
            const provider = new AnchorProvider(connection, new NodeWallet(Keypair.generate()), {});
            const programPubkey = new PublicKey(programId);

            const idl = await Program.fetchIdl(programPubkey, provider);

            if (idl) {
                setIdlData(idl);
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
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">Anchor Developer Tools</h5>
                    <p className="text-muted">Enter a program ID above to access Anchor developer tools.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card mb-4">
            <div className="card-header">
                <div className="row align-items-center">
                    <div className="col">
                        <h5 className="card-header-title mb-0">🔧 Anchor Developer Tools</h5>
                    </div>
                    <div className="col-auto">
                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setShowIdlInput(!showIdlInput)}
                        >
                            {showIdlInput ? 'Hide' : 'Manual IDL'}
                        </button>
                    </div>
                </div>
            </div>
            <div className="card-body">
                {loading && (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading IDL...</span>
                        </div>
                        <p className="text-muted mt-2">Fetching IDL from program...</p>
                    </div>
                )}

                {error && !showIdlInput && (
                    <div className="alert alert-warning">
                        <strong>Note:</strong> {error}
                        <button className="btn btn-sm btn-outline-primary ms-3" onClick={() => setShowIdlInput(true)}>
                            Paste IDL Manually
                        </button>
                    </div>
                )}

                {showIdlInput && (
                    <div className="mb-3">
                        <label className="form-label">Paste Your Program IDL (JSON format):</label>
                        <textarea
                            className="form-control font-monospace"
                            rows={10}
                            value={manualIdl}
                            onChange={e => setManualIdl(e.target.value)}
                            placeholder='{"version": "0.1.0", "name": "your_program", ...}'
                        />
                        <button className="btn btn-primary mt-2" onClick={handleManualIdl}>
                            Load IDL
                        </button>
                    </div>
                )}

                {idlData && (
                    <>
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <div className="p-3 bg-light rounded">
                                    <h6 className="text-muted mb-1">Program Name</h6>
                                    <h4 className="mb-0">{idlData.name}</h4>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 bg-light rounded">
                                    <h6 className="text-muted mb-1">IDL Version</h6>
                                    <h4 className="mb-0">{idlData.version}</h4>
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
                                                    <code className="me-2">{instruction.name}</code>
                                                    <span className="badge bg-info">
                                                        {instruction.accounts?.length || 0} accounts
                                                    </span>
                                                    <span className="badge bg-secondary ms-2">
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
                                                            <h6>Accounts:</h6>
                                                            <ul className="list-group">
                                                                {instruction.accounts.map((account: any, i: number) => (
                                                                    <li key={i} className="list-group-item">
                                                                        <code>{account.name}</code>
                                                                        {account.isMut && (
                                                                            <span className="badge bg-warning ms-2">
                                                                                mut
                                                                            </span>
                                                                        )}
                                                                        {account.isSigner && (
                                                                            <span className="badge bg-success ms-2">
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
                                                            <h6>Arguments:</h6>
                                                            <ul className="list-group">
                                                                {instruction.args.map((arg: any, i: number) => (
                                                                    <li key={i} className="list-group-item">
                                                                        <code>{arg.name}</code>
                                                                        <span className="text-muted ms-2">
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
                                                    <pre className="bg-light p-2 rounded">
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
                                            <pre className="bg-light p-2 rounded mb-0">
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
                                <h5 className="border-bottom pb-2">⚠️ Error Codes ({idlData.errors.length})</h5>
                                <div className="table-responsive">
                                    <table className="table table-sm">
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
                        <div className="alert alert-info">
                            <div className="d-flex justify-content-between align-items-center">
                                <span>
                                    <strong>Developer Tip:</strong> You can download the full IDL for offline use
                                </span>
                                <button
                                    className="btn btn-sm btn-primary"
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
