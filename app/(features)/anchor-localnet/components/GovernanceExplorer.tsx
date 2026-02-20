'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/(shared)/components/ui/dialog';
import { Input } from '@/app/(shared)/components/ui/input';
import { Label } from '@/app/(shared)/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(shared)/components/ui/select';
import {
  Gavel,
  RefreshCw,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Clock,
  Users,
  Plus,
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS, ENUM_MAPS } from '../config';

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
  ercValidityPeriod: number;
  totalErcsIssued: number;
  totalErcsValidated: number;
  totalErcsRevoked: number;
  totalEnergyCertified: number;
  createdAt: number;
  lastUpdated: number;
  allowCertificateTransfers: boolean;
  version: number;
}

interface ErcCertificateData {
  address: string;
  certificateId: string;
  authority: string;
  owner: string;
  energyAmount: number;
  renewableSource: string;
  issuedAt: number;
  status: string;
  validatedForTrading: boolean;
  transferCount: number;
}

export function GovernanceExplorer({ rpcUrl, getConnection }: GovernanceExplorerProps) {
  const [config, setConfig] = useState<PoAConfigData | null>(null);
  const [certificates, setCertificates] = useState<ErcCertificateData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showIssueErc, setShowIssueErc] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.governance.id);
      const accounts = await conn.getProgramAccounts(programId);

      let configData: PoAConfigData | null = null;
      const certList: ErcCertificateData[] = [];

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        const addr = pubkey.toBase58();

        // PoAConfig accounts are medium-sized (~400-500 bytes)
        // ErcCertificate accounts are larger (~600+ bytes)
        if (data.length > 300 && data.length < 600) {
          try {
            const d = data.slice(8);
            const authority = new PublicKey(d.slice(0, 32)).toBase58();
            // Read authority name (64 bytes fixed + 1 byte len)
            const nameLen = d[32 + 64];
            const authorityName = Buffer.from(d.slice(32, 32 + nameLen)).toString('utf8').replace(/\0/g, '');
            // Skip contact_info (128 + 1) and version (1)
            const offset = 32 + 64 + 1 + 128 + 1 + 1;
            const maintenanceMode = d[offset] === 1;
            const ercValidationEnabled = d[offset + 1] === 1;

            configData = {
              address: addr,
              authority,
              authorityName: authorityName || 'Unknown',
              maintenanceMode,
              ercValidationEnabled,
              minEnergyAmount: 0,
              maxErcAmount: 0,
              ercValidityPeriod: 0,
              totalErcsIssued: 0,
              totalErcsValidated: 0,
              totalErcsRevoked: 0,
              totalEnergyCertified: 0,
              createdAt: 0,
              lastUpdated: 0,
              allowCertificateTransfers: false,
              version: 1,
            };
          } catch {
            // Skip malformed
          }
        } else if (data.length >= 600) {
          try {
            const d = data.slice(8);
            // certificate_id: 64 bytes + 1 len byte
            const idLen = d[64];
            const certificateId = Buffer.from(d.slice(0, Math.min(idLen, 64))).toString('utf8').replace(/\0/g, '');
            const authority = new PublicKey(d.slice(65, 97)).toBase58();
            const owner = new PublicKey(d.slice(97, 129)).toBase58();
            const energyAmount = Number(d.readBigUInt64LE(129));
            // renewable_source: 64 bytes + 1 len byte at offset 137
            const sourceLen = d[137 + 64];
            const renewableSource = Buffer.from(d.slice(137, 137 + Math.min(sourceLen, 64))).toString('utf8').replace(/\0/g, '');

            certList.push({
              address: addr,
              certificateId: certificateId || addr.slice(0, 12),
              authority,
              owner,
              energyAmount,
              renewableSource: renewableSource || 'Unknown',
              issuedAt: 0,
              status: 'Valid',
              validatedForTrading: false,
              transferCount: 0,
            });
          } catch {
            // Skip malformed
          }
        }
      }

      setConfig(configData);
      setCertificates(certList);
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
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Gavel className="h-4 w-4 text-purple-500" />
          Governance Program
          <Badge variant="outline" className="font-mono text-[9px]">
            {PROGRAMS.governance.id.slice(0, 8)}...
          </Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setShowIssueErc(true)}
          >
            <Plus className="h-3 w-3" /> Issue ERC
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={fetchData}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
      </div>

      {/* PoA Config */}
      {config ? (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
            Proof-of-Authority Configuration
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-[10px] text-muted-foreground">Authority</p>
              <p className="font-mono text-[11px] font-medium">{config.authorityName}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Maintenance</p>
              <Badge
                variant={config.maintenanceMode ? 'destructive' : 'default'}
                className="text-[10px]"
              >
                {config.maintenanceMode ? (
                  <><AlertTriangle className="mr-1 h-3 w-3" />Enabled</>
                ) : (
                  <><ShieldCheck className="mr-1 h-3 w-3" />Operational</>
                )}
              </Badge>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">ERC Validation</p>
              <Badge variant={config.ercValidationEnabled ? 'default' : 'secondary'} className="text-[10px]">
                {config.ercValidationEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Certificate Transfers</p>
              <Badge variant={config.allowCertificateTransfers ? 'default' : 'secondary'} className="text-[10px]">
                {config.allowCertificateTransfers ? 'Allowed' : 'Blocked'}
              </Badge>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-[10px] text-muted-foreground">ERCs Issued</p>
              <p className="font-mono text-sm font-bold">{config.totalErcsIssued}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">ERCs Validated</p>
              <p className="font-mono text-sm font-bold">{config.totalErcsValidated}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">ERCs Revoked</p>
              <p className="font-mono text-sm font-bold">{config.totalErcsRevoked}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Energy Certified</p>
              <p className="font-mono text-sm font-bold">{config.totalEnergyCertified.toLocaleString()} kWh</p>
            </div>
          </div>
          <p className="mt-2 font-mono text-[9px] text-muted-foreground">
            Address: {config.address}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Gavel className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">
            No PoA config found. Run <code className="rounded bg-muted px-1">initialize_poa</code> first.
          </p>
        </div>
      )}

      {/* ERC Certificates */}
      <div>
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold">
          <FileCheck className="h-3.5 w-3.5" />
          ERC Certificates ({certificates.length})
        </h4>
        <ScrollArea className="h-[250px] rounded-md border">
          {certificates.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No ERC certificates found
            </div>
          ) : (
            <div className="divide-y">
              {certificates.map((cert) => (
                <div key={cert.address} className="p-3 text-xs hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-3.5 w-3.5 text-green-500" />
                      <span className="font-medium">{cert.certificateId}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[9px]">{cert.status}</Badge>
                      {cert.validatedForTrading && (
                        <Badge variant="default" className="text-[9px]">Trading</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                    <span>{cert.energyAmount.toLocaleString()} kWh</span>
                    <span>Source: {cert.renewableSource}</span>
                    <span>Transfers: {cert.transferCount}</span>
                  </div>
                  <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                    Owner: {cert.owner}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Issue ERC Dialog */}
      <IssueErcDialog
        open={showIssueErc}
        onOpenChange={setShowIssueErc}
        rpcUrl={rpcUrl}
        onSuccess={fetchData}
      />

      {/* Instructions */}
      <div className="rounded-lg border p-3">
        <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Available Instructions</h4>
        <div className="flex flex-wrap gap-1">
          {PROGRAMS.governance.instructions.map((ix) => (
            <Badge key={ix} variant="outline" className="font-mono text-[9px]">{ix}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// Issue ERC Dialog Component
interface IssueErcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rpcUrl: string;
  onSuccess: () => void;
}

function IssueErcDialog({ open, onOpenChange, rpcUrl, onSuccess }: IssueErcDialogProps) {
  const [certificateId, setCertificateId] = useState('');
  const [energyAmount, setEnergyAmount] = useState('1000');
  const [renewableSource, setRenewableSource] = useState('Solar');
  const [owner, setOwner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setTxSignature(null);

    try {
      const response = await fetch('/api/governance/issue-erc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: certificateId || `ERC-${Date.now()}`,
          energyAmount: parseInt(energyAmount),
          renewableSource,
          owner,
          validationData: '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to issue ERC');
      }

      const data = await response.json();
      setTxSignature(data.signature);

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setTxSignature(null);
        setCertificateId('');
        setEnergyAmount('1000');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Issue ERC Certificate
          </DialogTitle>
          <DialogDescription>
            Create a new Renewable Energy Certificate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="owner">Owner (Wallet Address)</Label>
            <Input
              id="owner"
              placeholder="Enter wallet address"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificateId">Certificate ID</Label>
            <Input
              id="certificateId"
              placeholder={`ERC-${Date.now()}`}
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="energyAmount">Energy Amount (kWh)</Label>
            <Input
              id="energyAmount"
              type="number"
              value={energyAmount}
              onChange={(e) => setEnergyAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renewableSource">Renewable Source</Label>
            <Select value={renewableSource} onValueChange={setRenewableSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Solar">☀️ Solar</SelectItem>
                <SelectItem value="Wind">💨 Wind</SelectItem>
                <SelectItem value="Hydro">💧 Hydro</SelectItem>
                <SelectItem value="Geothermal">🌋 Geothermal</SelectItem>
                <SelectItem value="Biomass">🌱 Biomass</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {txSignature && (
            <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700">
              ✅ ERC issued! TX: {txSignature.slice(0, 20)}...
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
              ❌ Error: {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !owner}>
            {isSubmitting ? 'Issuing...' : 'Issue ERC'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
