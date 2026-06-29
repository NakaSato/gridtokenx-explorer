'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import {
  Gavel,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import { cn } from '@/app/(shared)/utils/cn';
import { Card } from '@/app/(shared)/components/ui/card';

// Refactored Sub-components
import { InstructionReference } from './shared-explorer/InstructionReference';
import { PoAConfigCard } from './governance/PoAConfigCard';
import { CertificatesTable } from './governance/CertificatesTable';
import { IssueErcDialog } from './governance/IssueErcDialog';

interface GovernanceExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface PoAConfigData {
  address: string;
  authority: string;
  authorityName: string;
  maintenanceMode: boolean;
  ercValidationEnabled: boolean;
  minEnergyAmount: number;
  maxErcAmount: number;
}

interface CertificateData {
  address: string;
  certificateId: string;
  owner: string;
  renewableSource: string;
  energyAmount: number;
  status: string;
  validatedForTrading: boolean;
  createdAt: number;
}

export function GovernanceExplorer({ rpcUrl, getConnection }: GovernanceExplorerProps) {
  const [config, setConfig] = useState<PoAConfigData | null>(null);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showIssueErc, setShowIssueErc] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.governance.id);
      const accounts = await conn.getProgramAccounts(programId);

      const certList: CertificateData[] = [];
      let poaConfig: PoAConfigData | null = null;

      for (const { pubkey, account } of accounts) {
        const data = account.data;

        // GovernanceConfig / PoAConfig (Borsh) — total 337 bytes
        if (data.length === 337) {
          try {
            const d = data.slice(8);
            const nameLen = d[96];
            poaConfig = {
              address: pubkey.toBase58(),
              authority: new PublicKey(d.slice(0, 32)).toBase58(),
              authorityName: new TextDecoder().decode(d.slice(32, 32 + Math.min(nameLen, 64))).replace(/\0/g, ''),
              maintenanceMode: d[227] === 1,
              ercValidationEnabled: d[228] === 1,
              minEnergyAmount: Number(d.readBigUInt64LE(229)),
              maxErcAmount: Number(d.readBigUInt64LE(237)),
            };
          } catch (err) {
            console.error('Error parsing PoA config:', err);
          }
        }
        // ErcCertificate (Borsh) — total 645 bytes
        else if (data.length === 645) {
          try {
            const d = data.slice(8);
            const idLen = d[64];
            const sourceLen = d[201];
            const statusNum = d[477];
            // ErcStatus: Valid=0, Expired=1, Revoked=2, Pending=3
            const statuses = ['Valid', 'Expired', 'Revoked', 'Pending'];

            certList.push({
              address: pubkey.toBase58(),
              certificateId: new TextDecoder().decode(d.slice(0, Math.min(idLen, 64))).replace(/\0/g, ''),
              owner: new PublicKey(d.slice(97, 129)).toBase58(),
              energyAmount: Number(d.readBigUInt64LE(129)),
              renewableSource:
                new TextDecoder().decode(d.slice(137, 137 + Math.min(sourceLen, 64))).replace(/\0/g, '') || 'Unknown',
              status: statuses[statusNum] || 'Unknown',
              validatedForTrading: d[478] === 1,
              createdAt: Number(d.readBigInt64LE(460)), // issued_at
            });
          } catch (err) {
            console.error('Error parsing ERC certificate:', err);
          }
        }
      }

      setConfig(poaConfig);
      setCertificates(certList.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.warn('GovernanceExplorer fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
            <Gavel className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-none">Governance Program</h3>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {PROGRAMS.governance.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setShowIssueErc(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Issue ERC
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchData}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* PoA Config Card */}
      {config && <PoAConfigCard config={config} />}

      {/* Certificates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Renewable Certificates</h4>
          <Badge variant="outline" className="h-5 text-[9px] font-mono">{certificates.length} Total</Badge>
        </div>
        <Card className="overflow-hidden border-border/60">
          <CertificatesTable certificates={certificates} />
        </Card>
      </div>

      <InstructionReference title="Governance Instruction Set" instructions={PROGRAMS.governance.instructions} />

      {/* Issue ERC Dialog */}
      <IssueErcDialog
        open={showIssueErc}
        onOpenChange={setShowIssueErc}
        rpcUrl={rpcUrl}
        onSuccess={fetchData}
      />
    </div>
  );
}
