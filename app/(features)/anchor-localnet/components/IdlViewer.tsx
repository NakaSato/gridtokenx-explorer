'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/(shared)/components/ui/dialog';
import { Button } from '@/app/(shared)/components/ui/button';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/(shared)/components/ui/tabs';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import { 
  FileCode, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  Download,
  Braces,
  Boxes,
  FunctionSquare
} from 'lucide-react';

interface IdlViewerProps {
  programAddress: string;
  programName: string;
  idl?: object;
  isOpen: boolean;
  onClose: () => void;
}

interface IdlInstruction {
  name: string;
  accounts?: Array<{
    name: string;
    isMut?: boolean;
    isSigner?: boolean;
    docs?: string[];
  }>;
  args?: Array<{
    name: string;
    type: string | object;
  }>;
}

interface IdlAccount {
  name: string;
  type: {
    kind: string;
    fields?: Array<{
      name: string;
      type: string | object;
    }>;
  };
}

export function IdlViewer({ programAddress, programName, idl, isOpen, onClose }: IdlViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!idl) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              IDL Not Found
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              No IDL found for program <code className="bg-muted px-1 rounded">{programAddress}</code>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              The program may not have an Anchor IDL uploaded to the blockchain.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const typedIdl = idl as {
    name?: string;
    version?: string;
    instructions?: IdlInstruction[];
    accounts?: IdlAccount[];
    types?: Array<{ name: string; type: object }>;
    errors?: Array<{ code: number; name: string; msg?: string }>;
    metadata?: {
      address?: string;
    };
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(idl, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(idl, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${typedIdl.name || programName}-idl.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileCode className="h-5 w-5 text-primary" />
              {typedIdl.name || programName} IDL
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleCopy}
              >
                {copied ? (
                  <><CheckCircle2 className="h-4 w-4" /> Copied</>
                ) : (
                  <><Copy className="h-4 w-4" /> Copy</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              v{typedIdl.version || '0.0.0'}
            </Badge>
            <code className="text-xs text-muted-foreground font-mono">
              {programAddress}
            </code>
          </div>
        </DialogHeader>

        <Tabs defaultValue="instructions" className="w-full">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="instructions" className="gap-1">
              <FunctionSquare className="h-4 w-4" />
              Instructions ({typedIdl.instructions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="accounts" className="gap-1">
              <Boxes className="h-4 w-4" />
              Accounts ({typedIdl.accounts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="types" className="gap-1">
              <Braces className="h-4 w-4" />
              Types ({typedIdl.types?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="raw" className="gap-1">
              <FileCode className="h-4 w-4" />
              Raw JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="instructions" className="mt-0">
            <ScrollArea className="h-[50vh]">
              <div className="p-6 pt-2 space-y-3">
                {typedIdl.instructions?.map((ix, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-semibold text-sm mb-2">{ix.name}</h4>
                    {ix.accounts && ix.accounts.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Accounts:</p>
                        <div className="flex flex-wrap gap-1">
                          {ix.accounts.map((acc, aidx) => (
                            <Badge 
                              key={aidx} 
                              variant={acc.isMut ? 'default' : 'outline'}
                              className="text-[10px]"
                            >
                              {acc.name}
                              {acc.isSigner && ' (signer)'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {ix.args && ix.args.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Arguments:</p>
                        <div className="space-y-1">
                          {ix.args.map((arg, argidx) => (
                            <div key={argidx} className="flex items-center gap-2 text-xs">
                              <code className="bg-background px-1.5 py-0.5 rounded">
                                {arg.name}
                              </code>
                              <span className="text-muted-foreground">
                                {typeof arg.type === 'string' ? arg.type : JSON.stringify(arg.type)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {!typedIdl.instructions?.length && (
                  <p className="text-center text-muted-foreground py-8">
                    No instructions defined in IDL
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="accounts" className="mt-0">
            <ScrollArea className="h-[50vh]">
              <div className="p-6 pt-2 space-y-3">
                {typedIdl.accounts?.map((acc, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-semibold text-sm mb-2">{acc.name}</h4>
                    {acc.type.fields && (
                      <div className="space-y-1">
                        {acc.type.fields.map((field, fidx) => (
                          <div key={fidx} className="flex items-center gap-2 text-xs">
                            <code className="bg-background px-1.5 py-0.5 rounded">
                              {field.name}
                            </code>
                            <span className="text-muted-foreground">
                              {typeof field.type === 'string' ? field.type : JSON.stringify(field.type)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!typedIdl.accounts?.length && (
                  <p className="text-center text-muted-foreground py-8">
                    No account types defined in IDL
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="types" className="mt-0">
            <ScrollArea className="h-[50vh]">
              <div className="p-6 pt-2">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(typedIdl.types, null, 2)}
                </pre>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="raw" className="mt-0">
            <ScrollArea className="h-[50vh]">
              <div className="p-6 pt-2">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                  {JSON.stringify(idl, null, 2)}
                </pre>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default IdlViewer;
