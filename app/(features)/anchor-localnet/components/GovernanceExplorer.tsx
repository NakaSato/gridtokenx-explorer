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
import { Address } from '@/app/(shared)/components/Address';
import { readU64LE, readI64LE, readI32LE } from '../lib/bytes';

const pk = (s: string) => ({ toBase58: () => s });

// Refactored Sub-components
import { InstructionReference } from './shared-explorer/InstructionReference';
import { PoAConfigCard } from './governance/PoAConfigCard';
import { CertificatesTable } from './governance/CertificatesTable';
import { IssueErcDialog } from './governance/IssueErcDialog';
import { ProposalsTable, ProposalData } from './governance/ProposalsTable';
import { VotesTable, VoteData } from './governance/VotesTable';
import { ZonesTable, ZoneData } from './governance/ZonesTable';
import { AggregatorsTable, AggregatorData } from './governance/AggregatorsTable';

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
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [votes, setVotes] = useState<VoteData[]>([]);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [aggregators, setAggregators] = useState<AggregatorData[]>([]);
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
      const proposalList: ProposalData[] = [];
      const voteList: VoteData[] = [];
      const zoneList: ZoneData[] = [];
      const aggregatorList: AggregatorData[] = [];
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
              minEnergyAmount: Number(readU64LE(d, 229)),
              maxErcAmount: Number(readU64LE(d, 237)),
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
              energyAmount: Number(readU64LE(d, 129)),
              renewableSource:
                new TextDecoder().decode(d.slice(137, 137 + Math.min(sourceLen, 64))).replace(/\0/g, '') || 'Unknown',
              status: statuses[statusNum] || 'Unknown',
              validatedForTrading: d[478] === 1,
              createdAt: Number(readI64LE(d, 460)), // issued_at
            });
          } catch (err) {
            console.error('Error parsing ERC certificate:', err);
          }
        }
        // Proposal (Borsh) — total 87 bytes (8 disc + 79)
        else if (data.length === 87) {
          try {
            const d = data.slice(8);
            const params = ['IncentiveMultiplier', 'WheelingCharge', 'LossFactor', 'MaintenanceMode'];
            const pStatuses = ['Active', 'Passed', 'Rejected', 'Executed', 'Cancelled'];
            proposalList.push({
              address: pubkey.toBase58(),
              proposer: new PublicKey(d.slice(0, 32)).toBase58(),
              targetZone: readI32LE(d, 32),
              parameter: params[d[36]] || 'Unknown',
              newValue: Number(readU64LE(d, 37)),
              votesFor: Number(readU64LE(d, 45)),
              votesAgainst: Number(readU64LE(d, 53)),
              status: pStatuses[d[61]] || 'Unknown',
              expiresAt: Number(readI64LE(d, 62)),
              proposalId: Number(readU64LE(d, 70)),
            });
          } catch (err) {
            console.error('Error parsing proposal:', err);
          }
        }
        // VoteRecord (Borsh) — total 90 bytes (8 disc + 82)
        else if (data.length === 90) {
          try {
            const d = data.slice(8);
            voteList.push({
              address: pubkey.toBase58(),
              proposal: new PublicKey(d.slice(0, 32)).toBase58(),
              voter: new PublicKey(d.slice(32, 64)).toBase58(),
              choice: d[64] === 1,
              weight: Number(readU64LE(d, 65)),
              votedAt: Number(readI64LE(d, 73)),
            });
          } catch (err) {
            console.error('Error parsing vote:', err);
          }
        }
        // ZoneConfig (Borsh) — total 46 bytes (8 disc + 38)
        else if (data.length === 46) {
          try {
            const d = data.slice(8);
            zoneList.push({
              address: pubkey.toBase58(),
              zoneId: readI32LE(d, 0),
              incentiveMultiplier: Number(readU64LE(d, 4)),
              wheelingCharge: Number(readU64LE(d, 12)),
              lossFactor: Number(readU64LE(d, 20)),
              maintenanceMode: d[28] === 1,
              lastUpdated: Number(readI64LE(d, 29)),
            });
          } catch (err) {
            console.error('Error parsing zone config:', err);
          }
        }
        // AggregatorEntry (Borsh) — total 59 bytes (8 disc + 51)
        else if (data.length === 59) {
          try {
            const d = data.slice(8);
            const segments = ['Retail', 'Wholesale'];
            aggregatorList.push({
              address: pubkey.toBase58(),
              aggregator: new PublicKey(d.slice(0, 32)).toBase58(),
              admittedAt: Number(readI64LE(d, 32)),
              updatedAt: Number(readI64LE(d, 40)),
              active: d[48] === 1,
              segment: segments[d[50]] || 'Unknown',
            });
          } catch (err) {
            console.error('Error parsing aggregator entry:', err);
          }
        }
      }

      setConfig(poaConfig);
      setCertificates(certList.sort((a, b) => b.createdAt - a.createdAt));
      setProposals(proposalList.sort((a, b) => b.proposalId - a.proposalId));
      setVotes(voteList.sort((a, b) => b.votedAt - a.votedAt));
      setZones(zoneList.sort((a, b) => a.zoneId - b.zoneId));
      setAggregators(aggregatorList.sort((a, b) => b.admittedAt - a.admittedAt));
    } catch (err) {
      console.warn('GovernanceExplorer fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load governance data from RPC.');
      setConfig(null);
      setCertificates([]);
      setProposals([]);
      setVotes([]);
      setZones([]);
      setAggregators([]);
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
            <code className="mt-1 inline-block bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] tracking-wider text-[#14F195] [&_a]:text-[#14F195] [&_a:hover]:text-[#9945FF]">
              <Address pubkey={pk(PROGRAMS.governance.id)} link raw truncateChars={24} />
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

      {/* DAO Proposals Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">DAO Proposals</h4>
          <span className="border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] text-[#888]">{proposals.length} Total</span>
        </div>
        <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black">
          <ProposalsTable proposals={proposals} />
        </Card>
      </div>

      {/* DAO Votes Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Vote Records</h4>
          <span className="border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] text-[#888]">{votes.length} Total</span>
        </div>
        <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black">
          <VotesTable votes={votes} />
        </Card>
      </div>

      {/* Zone Config Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Zone Configuration</h4>
          <span className="border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] text-[#888]">{zones.length} Total</span>
        </div>
        <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black">
          <ZonesTable zones={zones} />
        </Card>
      </div>

      {/* Admitted Aggregators Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Admitted Aggregators</h4>
          <span className="border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-0.5 text-[9px] text-[#888]">{aggregators.length} Total</span>
        </div>
        <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black">
          <AggregatorsTable aggregators={aggregators} />
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
