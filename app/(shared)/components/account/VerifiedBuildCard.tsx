import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Copyable } from '@/app/(shared)/components/Copyable';

interface VerifiedBuildCardProps {
  account: {
    data: {
      parsed: {
        info: {
          verifiedBuild?: {
            verifier?: string;
            signature?: string;
            zipHash?: string;
            sourceHash?: string;
            lipmaaMerkleRoot?: string;
            merkleRoot?: string;
            lastModified?: number;
          };
        };
      };
    };
  };
}

export function VerifiedBuildCard({ account }: VerifiedBuildCardProps) {
  const verifiedBuild = account?.data?.parsed?.info?.verifiedBuild;

  if (!verifiedBuild) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verified Build</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">No verified build information available</div>
        </CardContent>
      </Card>
    );
  }

  const { verifier, signature, zipHash, sourceHash, lipmaaMerkleRoot, merkleRoot, lastModified } = verifiedBuild;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getVerifierExplorerUrl = (verifierAddress?: string) => {
    if (!verifierAddress) return '#';
    return `https://explorer.solana.com/address/${verifierAddress}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verified Build</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-muted-foreground text-sm">This program build has been cryptographically verified</div>

          <div className="grid gap-4">
            {verifier && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Verifier</div>
                <div className="flex items-center gap-2">
                  <Copyable text={verifier}>
                    <span className="font-mono text-sm">
                      {verifier.slice(0, 16)}...{verifier.slice(-16)}
                    </span>
                  </Copyable>
                  <a
                    href={getVerifierExplorerUrl(verifier)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ↗
                  </a>
                </div>
              </div>
            )}

            {signature && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Verification Signature</div>
                <div className="font-mono text-sm">
                  <Copyable text={signature}>
                    {signature.slice(0, 20)}...{signature.slice(-20)}
                  </Copyable>
                </div>
              </div>
            )}

            {zipHash && (
              <div className="space-y-2">
                <div className="text-sm font-medium">ZIP Hash</div>
                <div className="font-mono text-sm">
                  <Copyable text={zipHash}>
                    {zipHash.slice(0, 24)}...{zipHash.slice(-24)}
                  </Copyable>
                </div>
              </div>
            )}

            {sourceHash && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Source Hash</div>
                <div className="font-mono text-sm">
                  <Copyable text={sourceHash}>
                    {sourceHash.slice(0, 24)}...{sourceHash.slice(-24)}
                  </Copyable>
                </div>
              </div>
            )}

            {lipmaaMerkleRoot && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Lipmaa Merkle Root</div>
                <div className="font-mono text-sm">
                  <Copyable text={lipmaaMerkleRoot}>
                    {lipmaaMerkleRoot.slice(0, 24)}...{lipmaaMerkleRoot.slice(-24)}
                  </Copyable>
                </div>
              </div>
            )}

            {merkleRoot && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Merkle Root</div>
                <div className="font-mono text-sm">
                  <Copyable text={merkleRoot}>
                    {merkleRoot.slice(0, 24)}...{merkleRoot.slice(-24)}
                  </Copyable>
                </div>
              </div>
            )}

            {lastModified && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Last Modified</div>
                <div className="text-muted-foreground text-sm">{formatDate(lastModified)}</div>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <Badge className="border-green-200 bg-green-100 text-green-800">✓ Verified Build</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
