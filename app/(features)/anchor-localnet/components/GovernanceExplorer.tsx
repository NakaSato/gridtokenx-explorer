'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [showIssueErc, setShowIssueErc] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const conn = getConnection();
      if (!conn) {
        throw new Error(`Invalid RPC endpoint: "${rpcUrl}". Check cluster configuration.`);
      }
      const programId = new PublicKey(PROGRAMS.governance.id);
      const accounts = await conn.getProgramAccounts(programId);

      const certList: CertificateData[] = [];
      let poaConfig: PoAConfigData | null = null;

      for (const { pubkey, account } of accounts) {
        const data = account.data;

        // GovernanceConfig / PoAConfig (Borsh) — total 413 bytes
        if (data.length === 413) {
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
        // ErcCertificate (Borsh) — total 644 bytes (8 disc + ErcCertificate::LEN 636)
        else if (data.length === 644) {
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
      setError(err instanceof Error ? err.message : 'Failed to load governance data from RPC.');
      setConfig(null);
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  }, [getConnection, rpcUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-2 bg-black p-2 font-mono">
        <Skeleton className="h-24 w-full rounded-none bg-[#111]" />
        <Skeleton className="h-48 w-full rounded-none bg-[#111]" />
      </div>
    );
  }

  return (
    <div className="space-y-2 bg-black p-2 font-mono text-[#e0e0e0]">
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 border border-[#ff4d4d]/40 bg-[#ff4d4d]/10 p-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff6b6b]">RPC Error</span>
            <span className="text-[10px] text-[#e0a0a0]">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-none border-[#ff4d4d]/40 bg-[#0a0a0a] text-[10px] font-bold uppercase tracking-wider text-[#ff6b6b] hover:bg-[#ff4d4d]/10"
            onClick={fetchData}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-3 border border-[#2a2a2a] bg-[#111] p-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-[#9945FF]/15">
            <Gavel className="h-5 w-5 text-[#9945FF]" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Governance Program</h3>
            <code className="mt-1 inline-block bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] tracking-wider text-[#14F195]">
              {PROGRAMS.governance.id.slice(0, 24)}...
            </code>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-none bg-[#9945FF] text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#7d37d6]"
            onClick={() => setShowIssueErc(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Issue ERC
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-none border-[#2a2a2a] bg-[#0a0a0a] hover:bg-[#9945FF]/10" onClick={fetchData}>
            <RefreshCw className={cn("h-4 w-4 text-[#9945FF]", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* PoA Config Card */}
      {config && <PoAConfigCard config={config} />}

      {/* Certificates Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Renewable Certificates</h4>
          <span className="border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] text-[#888]">{certificates.length} Total</span>
        </div>
        <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black">
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
