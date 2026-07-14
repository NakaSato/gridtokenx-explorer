'use client';

import React from 'react';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { Progress } from '@/app/(shared)/components/ui/progress';
import { StatItem } from '../shared-explorer/Stats';
import { Activity, Shield, Clock, CheckCircle, XCircle, Gauge, Zap } from 'lucide-react';

interface OracleData {
  address: string;
  authority: string;
  chainBridge: string;
  totalReadings: number;
  totalValidReadings: number;
  totalRejectedReadings: number;
  totalGlobalEnergyProduced: number;
  totalGlobalEnergyConsumed: number;
  minEnergyValue: number;
  maxEnergyValue: number;
  lastReadingTime: number;
  lastClearing: number;
  createdAt: number;
  qualityScoreUpdatedAt: number;
  lastClearedEpoch: number;
  updateInterval: number;
  maxProductionConsumptionRatio: number;
  isActive: boolean;
  anomalyDetectionEnabled: boolean;
  securityLevel: number;
}

interface OracleStatsCardProps {
  oracle: OracleData;
}

function fmtTime(ts: number): string {
  if (!ts || ts <= 0) return 'Never';
  return new Date(ts * 1000).toLocaleString();
}

function DetailRow({ label, value, mono = false, color = 'text-[#e0e0e0]' }: { label: string; value: React.ReactNode; mono?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#1a1a1a] py-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-[#666]">{label}</span>
      <span className={`text-right text-[11px] ${mono ? 'font-mono' : 'font-bold'} ${color}`}>{value}</span>
    </div>
  );
}

export function OracleStatsCard({ oracle }: OracleStatsCardProps) {
  const securityProgress = Math.min((oracle.securityLevel / 100) * 100, 100);
  const validRate = oracle.totalReadings > 0
    ? ((oracle.totalValidReadings / oracle.totalReadings) * 100).toFixed(1)
    : '0.0';

  return (
    <Card className="overflow-hidden rounded-none border-[#2a2a2a] bg-black font-mono">
      <div className="flex items-center justify-between border-b border-[#2a2a2a] bg-[#111] px-3 py-2">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">Oracle Program Status</h4>
        {oracle.isActive ? (
          <span className="bg-[#14F195]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#14F195]">LIVE</span>
        ) : (
          <span className="bg-[#ff3333]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ff5555]">OFFLINE</span>
        )}
      </div>
      <CardContent className="p-3">
        {/* Headline stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 border border-[#2a2a2a] p-1.5">
              <Activity className="h-4 w-4 text-[#9945FF]" />
            </div>
            <StatItem label="Total Produced" value={`${oracle.totalGlobalEnergyProduced.toLocaleString()} kWh`} color="text-[#14F195]" />
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5 border border-[#2a2a2a] p-1.5">
              <Zap className="h-4 w-4 text-[#9945FF]" />
            </div>
            <StatItem label="Total Consumed" value={`${oracle.totalGlobalEnergyConsumed.toLocaleString()} kWh`} color="text-[#e0e0e0]" />
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5 border border-[#2a2a2a] p-1.5">
              <Clock className="h-4 w-4 text-[#9945FF]" />
            </div>
            <StatItem label="Update Frequency" value={`${oracle.updateInterval}s`} color="text-[#e0e0e0]" />
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5 border border-[#2a2a2a] p-1.5">
              <Gauge className="h-4 w-4 text-[#9945FF]" />
            </div>
            <StatItem label="Total Readings" value={oracle.totalReadings.toLocaleString()} color="text-[#e0e0e0]" />
          </div>
        </div>

        {/* Security + validity */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#666]">
              <Shield className="h-3 w-3" /> Quality Score
            </p>
            <Progress value={securityProgress} className="h-1.5 w-full bg-[#1a1a1a]" />
            <span className="text-[10px] font-bold text-[#14F195]">Score {oracle.securityLevel} / 100</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-[#666]">Reading Validity</p>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 font-bold text-[#14F195]"><CheckCircle className="h-3 w-3" /> {oracle.totalValidReadings.toLocaleString()} valid</span>
              <span className="flex items-center gap-1 font-bold text-[#ff5555]"><XCircle className="h-3 w-3" /> {oracle.totalRejectedReadings.toLocaleString()} rejected</span>
            </div>
            <span className="text-[10px] text-[#888]">{validRate}% acceptance rate</span>
          </div>
        </div>

        {/* Full field dump */}
        <div className="mt-4 grid grid-cols-1 gap-x-8 md:grid-cols-2">
          <div>
            <DetailRow label="Address" value={oracle.address} mono color="text-[#9945FF]" />
            <DetailRow label="Authority" value={oracle.authority} mono color="text-[#14F195]" />
            <DetailRow label="Chain Bridge" value={oracle.chainBridge} mono color="text-[#14F195]" />
            <DetailRow label="Active" value={oracle.isActive ? 'Yes' : 'No'} color={oracle.isActive ? 'text-[#14F195]' : 'text-[#ff5555]'} />
            <DetailRow label="Anomaly Detection" value={oracle.anomalyDetectionEnabled ? 'Enabled' : 'Disabled'} color={oracle.anomalyDetectionEnabled ? 'text-[#14F195]' : 'text-[#888]'} />
            <DetailRow label="Min Reading Interval" value={`${oracle.updateInterval}s`} mono />
            <DetailRow label="Max Prod/Cons Ratio" value={`${(oracle.maxProductionConsumptionRatio / 100).toFixed(2)}x`} mono />
          </div>
          <div>
            <DetailRow label="Min Energy Value" value={`${oracle.minEnergyValue.toLocaleString()} kWh`} mono />
            <DetailRow label="Max Energy Value" value={`${oracle.maxEnergyValue.toLocaleString()} kWh`} mono />
            <DetailRow label="Last Reading" value={fmtTime(oracle.lastReadingTime)} mono />
            <DetailRow label="Last Clearing" value={fmtTime(oracle.lastClearing)} mono />
            <DetailRow label="Last Cleared Epoch" value={fmtTime(oracle.lastClearedEpoch)} mono />
            <DetailRow label="Quality Updated" value={fmtTime(oracle.qualityScoreUpdatedAt)} mono />
            <DetailRow label="Created At" value={fmtTime(oracle.createdAt)} mono />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
