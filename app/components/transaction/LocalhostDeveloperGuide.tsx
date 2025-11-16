'use client';

import React from 'react';

interface LocalhostDeveloperGuideProps {
    isLocalhost: boolean;
}

export function LocalhostDeveloperGuide({ isLocalhost }: LocalhostDeveloperGuideProps) {
    const [isExpanded, setIsExpanded] = React.useState(isLocalhost);

    if (!isLocalhost) {
        return null;
    }

    return (
        <div className="card border-primary mb-4">
            <div className="card-header bg-primary text-white">
                <div className="flex items-center">
                    <div className="flex-1">
                        <h5 className="mb-0">🚀 Localhost Development Mode</h5>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            className="rounded-md border bg-white px-3 py-1.5 text-sm text-black hover:bg-gray-100"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? 'Hide Guide' : 'Show Guide'}
                        </button>
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className="p-6">
                    <div className="mb-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                        <strong>✅ Connected to Localhost!</strong> You're monitoring your local Solana test validator.
                    </div>

                    <h6 className="border-bottom mb-3 pb-2">Quick Start Commands</h6>
                    <div className="mb-4">
                        <div className="bg-dark text-light mb-2 rounded p-3">
                            <div className="mb-2">
                                <small className="text-muted-foreground"># Start local validator</small>
                            </div>
                            <code>solana-test-validator</code>
                        </div>
                        <div className="bg-dark text-light mb-2 rounded p-3">
                            <div className="mb-2">
                                <small className="text-muted-foreground"># Build your Anchor program</small>
                            </div>
                            <code>anchor build</code>
                        </div>
                        <div className="bg-dark text-light mb-2 rounded p-3">
                            <div className="mb-2">
                                <small className="text-muted-foreground"># Deploy to localhost</small>
                            </div>
                            <code>anchor deploy</code>
                        </div>
                        <div className="bg-dark text-light rounded p-3">
                            <div className="mb-2">
                                <small className="text-muted-foreground"># Get your program ID</small>
                            </div>
                            <code>solana address -k target/deploy/your_program-keypair.json</code>
                        </div>
                    </div>

                    <h6 className="border-bottom mb-3 pb-2">Energy Trading Platform Development Tips</h6>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <div className="bg-light h-100 rounded p-3">
                                <h6 className="text-primary">📝 Testing Energy Trades</h6>
                                <ul className="small mb-0">
                                    <li>Create test buyer/seller accounts</li>
                                    <li>Initialize escrow accounts</li>
                                    <li>Execute trade transactions</li>
                                    <li>Monitor balance changes here!</li>
                                </ul>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="bg-light h-100 rounded p-3">
                                <h6 className="text-primary">🐛 Debugging</h6>
                                <ul className="small mb-0">
                                    <li>Check program logs in Inspector</li>
                                    <li>Verify account permissions (signer/writable)</li>
                                    <li>Monitor compute units usage</li>
                                    <li>Track transaction fees</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <h6 className="border-bottom mb-3 pb-2">Anchor Program Structure</h6>
                    <div className="bg-light mb-3 rounded p-3">
                        <pre className="small mb-0">
                            {`programs/
  └── your_energy_program/
      ├── src/
      │   └── lib.rs           # Your program instructions
      └── Cargo.toml
target/
  ├── deploy/
  │   └── your_program-keypair.json  # Program address
  └── idl/
      └── your_program.json    # Generated IDL (paste above!)
tests/
  └── your_program.ts          # Integration tests
Anchor.toml                    # Cluster config`}
                        </pre>
                    </div>

                    <h6 className="border-bottom mb-3 pb-2">Common Localhost Issues & Solutions</h6>
                    <div className="accordion" id="localhostIssues">
                        <div className="accordion-item">
                            <h2 className="accordion-header">
                                <button
                                    className="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#issue1"
                                >
                                    ❌ "Failed to fetch transactions"
                                </button>
                            </h2>
                            <div id="issue1" className="accordion-collapse collapse" data-bs-parent="#localhostIssues">
                                <div className="accordion-body">
                                    <strong>Solution:</strong>
                                    <ul>
                                        <li>
                                            Ensure <code>solana-test-validator</code> is running
                                        </li>
                                        <li>Check if port 8899 is accessible</li>
                                        <li>Verify cluster is set to Custom: http://localhost:8899</li>
                                        <li>
                                            Try: <code>solana config get</code> to verify RPC URL
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="accordion-item">
                            <h2 className="accordion-header">
                                <button
                                    className="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#issue2"
                                >
                                    ❌ "IDL not found"
                                </button>
                            </h2>
                            <div id="issue2" className="accordion-collapse collapse" data-bs-parent="#localhostIssues">
                                <div className="accordion-body">
                                    <strong>Solution:</strong>
                                    <ul>
                                        <li>
                                            Run <code>anchor build</code> to generate IDL
                                        </li>
                                        <li>
                                            Find IDL at <code>target/idl/your_program.json</code>
                                        </li>
                                        <li>Click "Manual IDL" button above and paste the JSON</li>
                                        <li>IDL contains all instructions, accounts, and events</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="accordion-item">
                            <h2 className="accordion-header">
                                <button
                                    className="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#issue3"
                                >
                                    ❌ "Transaction failed"
                                </button>
                            </h2>
                            <div id="issue3" className="accordion-collapse collapse" data-bs-parent="#localhostIssues">
                                <div className="accordion-body">
                                    <strong>Debugging Steps:</strong>
                                    <ol>
                                        <li>Click "Inspect" on the failed transaction</li>
                                        <li>Check "Program Logs" section for error messages</li>
                                        <li>Verify all accounts are correct (compare with IDL)</li>
                                        <li>Check if signers have proper authority</li>
                                        <li>Ensure accounts have sufficient SOL for rent</li>
                                        <li>Look for compute budget exceeded errors</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div className="accordion-item">
                            <h2 className="accordion-header">
                                <button
                                    className="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#issue4"
                                >
                                    💡 "No transactions showing"
                                </button>
                            </h2>
                            <div id="issue4" className="accordion-collapse collapse" data-bs-parent="#localhostIssues">
                                <div className="accordion-body">
                                    <strong>Try this:</strong>
                                    <ul>
                                        <li>Enter your program ID in the field above</li>
                                        <li>
                                            Run your test suite: <code>anchor test</code>
                                        </li>
                                        <li>Make a manual transaction using Anchor client</li>
                                        <li>
                                            Check validator logs: <code>solana logs</code>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 mb-0 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-900">
                        <h6 className="mb-2 font-semibold">⚡ Pro Tips for Energy Trading Development:</h6>
                        <ul className="small mb-0">
                            <li>
                                <strong>Test with realistic data:</strong> Use actual energy amounts in your tests
                                (e.g., kWh values)
                            </li>
                            <li>
                                <strong>Monitor gas costs:</strong> Track compute units to optimize for mainnet
                                deployment
                            </li>
                            <li>
                                <strong>Use program logs:</strong> Add <code>msg!</code> macros in your Rust code for
                                debugging
                            </li>
                            <li>
                                <strong>Reset state:</strong> Use <code>solana-test-validator --reset</code> for clean
                                slate
                            </li>
                            <li>
                                <strong>Account size:</strong> Ensure your account structs have proper space allocation
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
