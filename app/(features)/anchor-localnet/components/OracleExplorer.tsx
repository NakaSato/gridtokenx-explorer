'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import { Progress } from '@/app/(shared)/components/ui/progress';
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
  Radio,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Gauge,
  Plus,
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';

interface OracleExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface OracleStateData {
  address: string;
  authority: string;
  apiGateway: string;
  totalReadings: number;
  lastReadingTimestamp: number;
  lastClearing: number;
  active: boolean;
  createdAt: number;
  minEnergyValue: number;
  maxEnergyValue: number;
  anomalyDetectionEnabled: boolean;
  maxReadingDeviationPercent: number;
  totalValidReadings: number;
  totalRejectedReadings: number;
  lastQualityScore: number;
  qualityScoreUpdatedAt: number;
  lastEnergyProduced: number;
  lastEnergyConsumed: number;
  totalGlobalEnergyProduced: number;
  totalGlobalEnergyConsumed: number;
  minReadingInterval: number;
  backupOraclesCount: number;
  consensusThreshold: number;
  requireConsensus: boolean;
}

export function OracleExplorer({ rpcUrl, getConnection }: OracleExplorerProps) {
  const [oracle, setOracle] = useState<OracleStateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSubmitReading, setShowSubmitReading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.oracle.id);
      const accounts = await conn.getProgramAccounts(programId);

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        // OracleData is a zero_copy account, large (~500+ bytes)
        if (data.length > 400) {
          try {
            const d = data.slice(8); // skip discriminator
            const authority = new PublicKey(d.slice(0, 32)).toBase58();
            const apiGateway = new PublicKey(d.slice(32, 64)).toBase58();
            // Skip backup_oracles (320 bytes) -> offset 384
            const off = 384;
            const totalReadings = Number(d.readBigUInt64LE(off));
            const lastReadingTimestamp = Number(d.readBigInt64LE(off + 8));
            const lastClearing = Number(d.readBigInt64LE(off + 16));
            const createdAt = Number(d.readBigInt64LE(off + 24));
            const minEnergyValue = Number(d.readBigUInt64LE(off + 32));
            const maxEnergyValue = Number(d.readBigUInt64LE(off + 40));
            const totalValidReadings = Number(d.readBigUInt64LE(off + 48));
            const totalRejectedReadings = Number(d.readBigUInt64LE(off + 56));
            const qualityScoreUpdatedAt = Number(d.readBigInt64LE(off + 64));
            const lastConsensusTimestamp = Number(d.readBigInt64LE(off + 72));
            const lastEnergyProduced = Number(d.readBigUInt64LE(off + 80));
            const lastEnergyConsumed = Number(d.readBigUInt64LE(off + 88));
            const totalGlobalEnergyProduced = Number(d.readBigUInt64LE(off + 96));
            const totalGlobalEnergyConsumed = Number(d.readBigUInt64LE(off + 104));
            const minReadingInterval = d.readUInt16LE(off + 112);
            // Skip 6 bytes padding
            // off + 120: last_cleared_epoch (8 bytes)
            const off2 = off + 128;
            const averageReadingInterval = d.readUInt32LE(off2);
            const maxReadingDeviationPercent = d.readUInt16LE(off2 + 4);
            const maxProductionConsumptionRatio = d.readUInt16LE(off2 + 6);
            const active = d[off2 + 8] === 1;
            const anomalyDetectionEnabled = d[off2 + 9] === 1;
            const requireConsensus = d[off2 + 10] === 1;
            const lastQualityScore = d[off2 + 11];
            const backupOraclesCount = d[off2 + 12];
            const consensusThreshold = d[off2 + 13];

            setOracle({
              address: pubkey.toBase58(),
              authority,
              apiGateway,
              totalReadings,
              lastReadingTimestamp,
              lastClearing,
              active,
              createdAt,
              minEnergyValue,
              maxEnergyValue,
              anomalyDetectionEnabled,
              maxReadingDeviationPercent,
              totalValidReadings,
              totalRejectedReadings,
              lastQualityScore,
              qualityScoreUpdatedAt,
              lastEnergyProduced,
              lastEnergyConsumed,
              totalGlobalEnergyProduced,
              totalGlobalEnergyConsumed,
              minReadingInterval,
              backupOraclesCount,
              consensusThreshold,
              requireConsensus,
            });
            break;
          } catch {
            // Skip malformed
          }
        }
      }
    } catch (err) {
      console.warn('OracleExplorer fetch error:', err);
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

  const validRate = oracle && oracle.totalReadings > 0
    ? ((oracle.totalValidReadings / oracle.totalReadings) * 100)
    : 0;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Radio className="h-4 w-4 text-blue-500" />
          Oracle Program
          <Badge variant="outline" className="font-mono text-[9px]">
            {PROGRAMS.oracle.id.slice(0, 8)}...
          </Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setShowSubmitReading(true)}
          >
            <Plus className="h-3 w-3" /> Reading
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={fetchData}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
      </div>

      {oracle ? (
        <>
          {/* Status Row */}
          <div className="flex items-center gap-2">
            <Badge variant={oracle.active ? 'default' : 'destructive'} className="gap-1">
              {oracle.active ? (
                <><CheckCircle2 className="h-3 w-3" /> Active</>
              ) : (
                <><AlertTriangle className="h-3 w-3" /> Inactive</>
              )}
            </Badge>
            <Badge variant={oracle.anomalyDetectionEnabled ? 'default' : 'secondary'} className="gap-1 text-[10px]">
              <Shield className="h-3 w-3" /> Anomaly Detection {oracle.anomalyDetectionEnabled ? 'ON' : 'OFF'}
            </Badge>
            {oracle.requireConsensus && (
              <Badge variant="outline" className="text-[10px]">
                Consensus Required ({oracle.consensusThreshold})
              </Badge>
            )}
          </div>

          {/* Main Stats */}
          <div className="rounded-lg border bg-card p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Meter Reading Statistics</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Total Readings</p>
                <p className="font-mono text-sm font-bold">{oracle.totalReadings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Valid</p>
                <p className="font-mono text-sm font-bold text-green-500">{oracle.totalValidReadings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Rejected</p>
                <p className="font-mono text-sm font-bold text-red-500">{oracle.totalRejectedReadings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Quality Score</p>
                <p className="font-mono text-sm font-bold">{oracle.lastQualityScore}/100</p>
              </div>
            </div>

            {/* Validation Rate Progress */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Validation Rate</span>
                <span className="font-mono font-medium">{validRate.toFixed(1)}%</span>
              </div>
              <Progress value={validRate} className="h-1.5" />
            </div>
          </div>

          {/* Energy Data */}
          <div className="rounded-lg border bg-card p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Energy Data</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Total Produced</p>
                <p className="font-mono text-sm font-bold">{oracle.totalGlobalEnergyProduced.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Total Consumed</p>
                <p className="font-mono text-sm font-bold">{oracle.totalGlobalEnergyConsumed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Last Produced</p>
                <p className="font-mono text-sm font-bold">{oracle.lastEnergyProduced.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Last Consumed</p>
                <p className="font-mono text-sm font-bold">{oracle.lastEnergyConsumed.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Config Details */}
          <div className="rounded-lg border bg-card p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Oracle Configuration</h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] text-muted-foreground">Min Reading Interval</p>
                <p className="font-mono text-xs">{oracle.minReadingInterval}s</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Max Deviation</p>
                <p className="font-mono text-xs">{oracle.maxReadingDeviationPercent}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Energy Range</p>
                <p className="font-mono text-xs">{oracle.minEnergyValue} - {oracle.maxEnergyValue}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Backup Oracles</p>
                <p className="font-mono text-xs">{oracle.backupOraclesCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Last Reading</p>
                <p className="font-mono text-xs">
                  {oracle.lastReadingTimestamp > 0
                    ? new Date(oracle.lastReadingTimestamp * 1000).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Last Clearing</p>
                <p className="font-mono text-xs">
                  {oracle.lastClearing > 0
                    ? new Date(oracle.lastClearing * 1000).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="font-mono text-[9px] text-muted-foreground">Authority: {oracle.authority}</p>
              <p className="font-mono text-[9px] text-muted-foreground">API Gateway: {oracle.apiGateway}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-lg border p-3">
            <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Available Instructions</h4>
            <div className="flex flex-wrap gap-1">
              {PROGRAMS.oracle.instructions.map((ix) => (
                <Badge key={ix} variant="outline" className="font-mono text-[9px]">{ix}</Badge>
              ))}
            </div>
          </div>

          {/* Submit Reading Dialog */}
          <SubmitReadingDialog
            open={showSubmitReading}
            onOpenChange={setShowSubmitReading}
            rpcUrl={rpcUrl}
            onSuccess={fetchData}
          />
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Radio className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">
            No oracle data found. Run <code className="rounded bg-muted px-1">initialize</code> first.
          </p>
        </div>
      )}
    </div>
  );
}

// Submit Reading Dialog Component
interface SubmitReadingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rpcUrl: string;
  onSuccess: () => void;
}

function SubmitReadingDialog({ open, onOpenChange, rpcUrl, onSuccess }: SubmitReadingDialogProps) {
  const [meterId, setMeterId] = useState('');
  const [energyProduced, setEnergyProduced] = useState('5000');
  const [energyConsumed, setEnergyConsumed] = useState('2300');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setTxSignature(null);

    try {
      const response = await fetch('/api/oracle/submit-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterId: meterId || `METER-${Date.now()}`,
          energyProduced: parseInt(energyProduced),
          energyConsumed: parseInt(energyConsumed),
          timestamp: Math.floor(Date.now() / 1000),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reading');
      }

      const data = await response.json();
      setTxSignature(data.signature);

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setTxSignature(null);
        setMeterId('');
        setEnergyProduced('5000');
        setEnergyConsumed('2300');
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
            <Plus className="h-4 w-4" /> Submit Meter Reading
          </DialogTitle>
          <DialogDescription>
            Submit energy reading from smart meter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="meterId">Meter ID</Label>
            <Input
              id="meterId"
              placeholder="Enter meter ID"
              value={meterId}
              onChange={(e) => setMeterId(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="energyProduced">Energy Produced (Wh)</Label>
              <Input
                id="energyProduced"
                type="number"
                value={energyProduced}
                onChange={(e) => setEnergyProduced(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="energyConsumed">Energy Consumed (Wh)</Label>
              <Input
                id="energyConsumed"
                type="number"
                value={energyConsumed}
                onChange={(e) => setEnergyConsumed(e.target.value)}
              />
            </div>
          </div>

          {txSignature && (
            <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700">
              ✅ Reading submitted! TX: {txSignature.slice(0, 20)}...
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
          <Button onClick={handleSubmit} disabled={isSubmitting || !meterId}>
            {isSubmitting ? 'Submitting...' : 'Submit Reading'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
