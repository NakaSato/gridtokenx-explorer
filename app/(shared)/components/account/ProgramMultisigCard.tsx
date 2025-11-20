import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Copyable } from '@/app/(shared)/components/Copyable';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Address } from '@/app/(shared)/components/Address';

interface SignerInfo {
  pubkey: string;
  signature?: string;
}

interface MultisigInfo {
  threshold: number;
  signers: SignerInfo[];
  minimumSigners?: number;
  transaction?: {
    data?: string;
    accounts?: Array<{
      pubkey: string;
      isSigner: boolean;
      isWritable: boolean;
    }>;
  };
}

interface ProgramMultisigCardProps {
  account: {
    data: {
      parsed: {
        info: MultisigInfo;
      };
    };
  };
}

export function ProgramMultisigCard({ account }: ProgramMultisigCardProps) {
  const multisigInfo = account?.data?.parsed?.info;

  if (!multisigInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Program Multisig</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">No multisig information available</div>
        </CardContent>
      </Card>
    );
  }

  const { threshold, signers, minimumSigners, transaction } = multisigInfo;
  const currentSignatures = signers.filter(signer => signer.signature).length;
  const isFullySigned = currentSignatures >= threshold;

  const getSignerStatusColor = (hasSignature: boolean) => {
    return hasSignature ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSignerStatusText = (hasSignature: boolean) => {
    return hasSignature ? 'Signed' : 'Pending';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Multisig</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">Threshold</div>
              <div className="text-lg font-medium">
                {threshold} / {signers.length} required
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">Status</div>
              <Badge
                className={
                  isFullySigned
                    ? 'border-green-200 bg-green-100 text-green-800'
                    : 'border-yellow-200 bg-yellow-100 text-yellow-800'
                }
              >
                {isFullySigned ? 'Complete' : `Pending ${currentSignatures}/${threshold}`}
              </Badge>
            </div>
          </div>

          {minimumSigners && minimumSigners !== threshold && (
            <div className="text-muted-foreground text-sm">Minimum signers required: {minimumSigners}</div>
          )}

          <div className="space-y-4">
            <div className="text-sm font-medium">Signers</div>
            <div className="space-y-3">
              {signers.map((signer, index) => (
                <div key={index} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Signer #{index + 1}</span>
                      <Badge className={getSignerStatusColor(!!signer.signature)}>
                        {getSignerStatusText(!!signer.signature)}
                      </Badge>
                    </div>
                    {signer.signature && <div className="text-muted-foreground text-xs">✓ Signed</div>}
                  </div>
                  <div className="mt-2">
                    <Address pubkey={signer.pubkey as any} link truncate />
                  </div>
                  {signer.signature && (
                    <div className="mt-2 text-xs">
                      <span className="text-muted-foreground">Signature: </span>
                      <Copyable text={signer.signature}>
                        <span className="font-mono">
                          {signer.signature.slice(0, 20)}...{signer.signature.slice(-20)}
                        </span>
                      </Copyable>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {transaction && (
            <div className="space-y-4">
              <div className="text-sm font-medium">Transaction Details</div>

              {transaction.data && (
                <div className="space-y-2">
                  <div className="text-muted-foreground text-sm">Transaction Data</div>
                  <div className="rounded-lg border p-3">
                    <Copyable text={transaction.data}>
                      <span className="font-mono text-xs break-all">{transaction.data}</span>
                    </Copyable>
                  </div>
                </div>
              )}

              {transaction.accounts && transaction.accounts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-muted-foreground text-sm">Accounts ({transaction.accounts.length})</div>
                  <div className="space-y-2">
                    {transaction.accounts.slice(0, 5).map((account, index) => (
                      <div key={index} className="flex items-center justify-between rounded border p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Address pubkey={account.pubkey as any} truncate />
                          {account.isSigner && (
                            <Badge variant="outline" className="text-xs">
                              Signer
                            </Badge>
                          )}
                          {account.isWritable && (
                            <Badge variant="outline" className="text-xs">
                              Writable
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground">Account #{index + 1}</div>
                      </div>
                    ))}
                    {transaction.accounts.length > 5 && (
                      <div className="text-muted-foreground py-2 text-center text-xs">
                        ... and {transaction.accounts.length - 5} more account
                        {transaction.accounts.length - 5 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <div className="text-muted-foreground text-xs">
              Multisig requires {threshold} of {signers.length} signatures
              {minimumSigners && ` (minimum: ${minimumSigners})`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
