import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Copyable } from '@/app/(shared)/components/Copyable';

interface TokenExtension {
  extension: string;
  state: 'Enabled' | 'Disabled';
}

interface TokenExtensionsCardProps {
  account: {
    data: {
      parsed: {
        info: {
          extensions: TokenExtension[];
          extensionTypes?: string[];
        };
      };
    };
  };
}

export function TokenExtensionsCard({ account }: TokenExtensionsCardProps) {
  const extensions = account?.data?.parsed?.info?.extensions || [];
  const extensionTypes = account?.data?.parsed?.info?.extensionTypes || [];

  const getExtensionDescription = (extension: string): string => {
    const descriptions: Record<string, string> = {
      transferFee: 'Transfer Fee Extension - Adds fee functionality to token transfers',
      confidentialTransfer: 'Confidential Transfer Extension - Enables encrypted transfers',
      confidentialTransferFee: 'Confidential Transfer Fee Extension - Fees for confidential transfers',
      defaultAccountState: 'Default Account State Extension - Sets default account states',
      immutableOwner: 'Immutable Owner Extension - Prevents owner changes',
      memoTransfer: 'Memo Transfer Extension - Adds memo support to transfers',
      nonTransferable: 'Non-Transferable Extension - Prevents token transfers',
      interestBearing: 'Interest Bearing Extension - Tokens can earn interest',
      cpiGuard: 'CPI Guard Extension - Consumer protection features',
      permanentDelegate: 'Permanent Delegate Extension - Sets permanent delegate',
      nonTransferableAccount: 'Non-Transferable Account Extension - Account-specific transfer restrictions',
      transferHook: 'Transfer Hook Extension - Custom logic on transfers',
      metadataPointer: 'Metadata Pointer Extension - Points to external metadata',
      groupPointer: 'Group Pointer Extension - Points to token group',
      groupMemberPointer: 'Group Member Pointer Extension - Points to group member',
      closeAuthority: 'Close Authority Extension - Allows closing accounts',
      confidentialTransferMint: 'Confidential Transfer Mint Extension - Mint-level confidentiality',
    };

    return descriptions[extension] || `${extension} Extension`;
  };

  const getExtensionColor = (state: string) => {
    return state === 'Enabled'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Extensions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {extensions.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">No token extensions enabled</div>
          ) : (
            <>
              <div className="text-muted-foreground text-sm">
                This token has {extensions.length} extension{extensions.length !== 1 ? 's' : ''} enabled
              </div>
              {extensions.map((extension, index) => (
                <div key={index} className="space-y-2 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{extension.extension}</h3>
                      <Badge className={getExtensionColor(extension.state)}>{extension.state}</Badge>
                    </div>
                    <div className="text-muted-foreground text-xs">Extension #{index + 1}</div>
                  </div>
                  <p className="text-muted-foreground text-sm">{getExtensionDescription(extension.extension)}</p>
                  {extensionTypes && extensionTypes[index] && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Type: </span>
                      <Copyable text={extensionTypes[index]}>
                        <span className="font-mono">{extensionTypes[index]}</span>
                      </Copyable>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
