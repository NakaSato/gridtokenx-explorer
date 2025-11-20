'use client';

import { Idl } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/(shared)/components/ui/accordion';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Card, CardContent, CardHeader } from '@/app/(shared)/components/ui/card';

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
      const response = await fetch(
        `/api/anchor?cluster=${encodeURIComponent(clusterUrl)}&programAddress=${encodeURIComponent(programId)}`,
      );
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
      <Card>
        <CardContent className="p-6">
          <h5 className="text-lg font-semibold">Anchor Developer Tools</h5>
          <p className="text-muted-foreground">Enter a program ID above to access Anchor developer tools.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h5 className="mb-0 text-lg font-semibold">🔧 Anchor Developer Tools</h5>
          </div>
          <div className="flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setShowIdlInput(!showIdlInput)}>
              {showIdlInput ? 'Hide' : 'Manual IDL'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading && (
          <div className="py-4 text-center">
            <div
              className="border-primary inline-block h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              role="status"
            >
              <span className="sr-only">Loading IDL...</span>
            </div>
            <p className="text-muted-foreground mt-2">Fetching IDL from program...</p>
          </div>
        )}

        {error && !showIdlInput && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
            <strong>Note:</strong> {error}
            <Button variant="outline" size="sm" className="ml-3" onClick={() => setShowIdlInput(true)}>
              Paste IDL Manually
            </Button>
          </div>
        )}

        {showIdlInput && (
          <div className="mb-3">
            <label className="mb-2 block text-sm font-medium">Paste Your Program IDL (JSON format):</label>
            <textarea
              className="w-full rounded-md border px-3 py-2 font-mono text-sm"
              rows={10}
              value={manualIdl}
              onChange={e => setManualIdl(e.target.value)}
              placeholder='{"version": "0.1.0", "name": "your_program", ...}'
            />
            <Button className="mt-2" onClick={handleManualIdl}>
              Load IDL
            </Button>
          </div>
        )}

        {idlData && (
          <>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="rounded bg-gray-50 p-3">
                  <h6 className="text-muted-foreground mb-1 text-sm">Program Name</h6>
                  <h4 className="mb-0 text-xl font-bold">{idlData.name}</h4>
                </div>
              </div>
              <div>
                <div className="rounded bg-gray-50 p-3">
                  <h6 className="text-muted-foreground mb-1 text-sm">IDL Version</h6>
                  <h4 className="mb-0 text-xl font-bold">{idlData.version}</h4>
                </div>
              </div>
            </div>

            {/* Instructions */}
            {idlData.instructions && idlData.instructions.length > 0 && (
              <div className="mb-4">
                <h5 className="mb-4 border-b pb-2 text-base font-semibold">
                  Instructions ({idlData.instructions.length})
                </h5>
                <Accordion type="single" collapsible className="space-y-2">
                  {idlData.instructions.map((instruction: any, idx: number) => (
                    <AccordionItem key={idx} value={`instruction-${idx}`} className="rounded-lg border">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-semibold">{instruction.name}</code>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {instruction.accounts?.length || 0} accounts
                          </Badge>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                            {instruction.args?.length || 0} args
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        {instruction.accounts && instruction.accounts.length > 0 && (
                          <div className="mb-3">
                            <h6 className="mb-2 text-sm font-semibold">Accounts:</h6>
                            <ul className="space-y-2">
                              {instruction.accounts.map((account: any, i: number) => (
                                <li key={i} className="rounded border px-3 py-2">
                                  <code className="text-sm">{account.name}</code>
                                  {account.isMut && (
                                    <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                                      mut
                                    </Badge>
                                  )}
                                  {account.isSigner && (
                                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                                      signer
                                    </Badge>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {instruction.args && instruction.args.length > 0 && (
                          <div>
                            <h6 className="mb-2 text-sm font-semibold">Arguments:</h6>
                            <ul className="space-y-2">
                              {instruction.args.map((arg: any, i: number) => (
                                <li key={i} className="rounded border px-3 py-2">
                                  <code className="text-sm">{arg.name}</code>
                                  <span className="text-muted-foreground ml-2 text-sm">
                                    : {JSON.stringify(arg.type)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Accounts/State */}
            {idlData.accounts && idlData.accounts.length > 0 && (
              <div className="mb-4">
                <h5 className="mb-4 border-b pb-2 text-base font-semibold">
                  Account Types ({idlData.accounts.length})
                </h5>
                <Accordion type="single" collapsible className="space-y-2">
                  {idlData.accounts.map((account: any, idx: number) => (
                    <AccordionItem key={idx} value={`account-${idx}`} className="rounded-lg border">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <code className="text-sm font-semibold">{account.name}</code>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <pre className="overflow-x-auto rounded bg-gray-50 p-3 text-sm">
                          {JSON.stringify(account.type, null, 2)}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* Events */}
            {idlData.events && idlData.events.length > 0 && (
              <div className="mb-4">
                <h5 className="mb-4 border-b pb-2 text-base font-semibold">Events ({idlData.events.length})</h5>
                <div className="space-y-3">
                  {idlData.events.map((event: any, idx: number) => (
                    <div key={idx} className="rounded border p-4">
                      <h6 className="mb-3 text-sm font-semibold">
                        <code>{event.name}</code>
                      </h6>
                      <pre className="mb-0 overflow-x-auto rounded bg-gray-50 p-3 text-sm">
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
                <h5 className="mb-4 border-b pb-2 text-base font-semibold">Error Codes ({idlData.errors.length})</h5>
                <div className="overflow-x-auto rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Code</th>
                        <th className="px-4 py-3 text-left font-semibold">Name</th>
                        <th className="px-4 py-3 text-left font-semibold">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {idlData.errors.map((error: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-3">
                            <code className="text-sm">{error.code}</code>
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-sm">{error.name}</code>
                          </td>
                          <td className="px-4 py-3">{error.msg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Full IDL Download */}
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
              <div className="flex items-center justify-between">
                <span>
                  <strong>Developer Tip:</strong> You can download the full IDL for offline use
                </span>
                <Button
                  size="sm"
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
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
