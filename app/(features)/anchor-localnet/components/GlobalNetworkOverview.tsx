'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Progress } from '@/app/(shared)/components/ui/progress';
import { 
  Activity, 
  Database, 
  Zap, 
  ShieldCheck, 
  Radio, 
  BarChart3,
  Globe,
  Cpu
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import { cn } from '@/app/(shared)/utils/cn';

interface GlobalNetworkOverviewProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface SystemStats {
  registry: { users: number; meters: number; status: string };
  trading: { volume: number; trades: number; lastPrice: number; status: string };
  governance: { operational: boolean; poaStatus: string };
  oracle: { submissions: number; status: string };
  performance: { tps: number; slot: number };
}

export function GlobalNetworkOverview({ rpcUrl, getConnection }: GlobalNetworkOverviewProps) {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGlobalState = useCallback(async () => {
    try {
      const conn = getConnection();
      const [slot, performanceSamples] = await Promise.all([
        conn.getSlot(),
        conn.getRecentPerformanceSamples(1)
      ]);

      const tps = performanceSamples[0]?.numTransactions / performanceSamples[0]?.samplePeriodSecs || 0;

      // Fetch Program Accounts for Stats
      const [registryAccounts, tradingAccounts, oracleAccounts] = await Promise.all([
        conn.getProgramAccounts(new PublicKey(PROGRAMS.registry.id)),
        conn.getProgramAccounts(new PublicKey(PROGRAMS.trading.id)),
        conn.getProgramAccounts(new PublicKey(PROGRAMS.oracle.id)),
      ]);

      // Calculate Registry Stats
      let users = 0;
      let meters = 0;
      registryAccounts.forEach(({ account }) => {
        if (account.data.length >= 64 && account.data.length < 128) users++;
        if (account.data.length >= 128 && account.data.length < 300) meters++;
      });

      // Calculate Trading Stats
      let volume = 0;
      let trades = 0;
      let lastPrice = 0;
      tradingAccounts.forEach(({ account }) => {
        const data = account.data;
        if (data.length > 500) {
           const d = data.slice(8);
           volume = Number(d.readBigUInt64LE(32));
           trades = d.readUInt32LE(68);
           lastPrice = Number(d.readBigUInt64LE(48));
        }
      });

      setStats({
        registry: { users, meters, status: 'Active' },
        trading: { volume, trades, lastPrice, status: 'Operational' },
        governance: { operational: true, poaStatus: 'PoA Consensus' },
        oracle: { submissions: oracleAccounts.length, status: 'Listening' },
        performance: { tps, slot }
      });
    } catch (err) {
      console.error('GlobalNetworkOverview fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    fetchGlobalState();
    const interval = setInterval(fetchGlobalState, 5000);
    return () => clearInterval(interval);
  }, [fetchGlobalState]);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-muted/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Network Pulse Bar */}
      <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Globe className="h-6 w-6 text-primary animate-spin-slow" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary/80">Global Network Pulse</h2>
            <p className="text-[10px] font-mono text-muted-foreground">Localnet Layer-1 • Ko Tao Grid Instance</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
           <PulseMetric label="Network TPS" value={stats.performance.tps.toFixed(1)} icon={<Activity className="h-3.5 w-3.5" />} />
           <PulseMetric label="Current Slot" value={stats.performance.slot.toLocaleString()} icon={<Cpu className="h-3.5 w-3.5" />} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Marketplace Card */}
        <ProgramStatusCard 
          title="P2P Marketplace" 
          programName="Trading"
          icon={<Zap className="h-5 w-5 text-yellow-500" />}
          metrics={[
            { label: 'Total Energy Traded', value: `${stats.trading.volume.toLocaleString()} kWh` },
            { label: 'Execution Count', value: stats.trading.trades.toString() },
            { label: 'Clearing Price', value: `${stats.trading.lastPrice.toLocaleString()} THB` }
          ]}
          status="Operational"
          color="yellow"
        />

        {/* Identity & Devices */}
        <ProgramStatusCard 
          title="Grid Registry" 
          programName="Identity"
          icon={<Database className="h-5 w-5 text-blue-500" />}
          metrics={[
            { label: 'Registered Identities', value: stats.registry.users.toString() },
            { label: 'Active Smart Meters', value: stats.registry.meters.toString() },
            { label: 'Nodes Online', value: (stats.registry.users + stats.registry.meters).toString() }
          ]}
          status="Synchronized"
          color="blue"
        />

        {/* Proof of Authority */}
        <ProgramStatusCard 
          title="PoA Governance" 
          programName="Governance"
          icon={<ShieldCheck className="h-5 w-5 text-green-500" />}
          metrics={[
            { label: 'Consensus Mode', value: stats.governance.poaStatus },
            { label: 'Platform Status', value: stats.governance.operational ? 'Operational' : 'Maintenance' },
            { label: 'Security Level', value: 'High' }
          ]}
          status="Stable"
          color="green"
        />
      </div>

      {/* Data Ingestion Pipeline */}
      <Card className="border-border/60 overflow-hidden bg-card/40 backdrop-blur-md">
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-purple-500" />
            <h3 className="text-xs font-bold uppercase tracking-tight">Oracle Telemetry Ingestion</h3>
          </div>
          <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200">Listening to Grid</Badge>
        </div>
        <CardContent className="p-6">
           <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Clearing Window Progress</span>
              <span className="text-xs font-mono">15m Period</span>
           </div>
           <Progress value={65} className="h-1.5 mb-6 bg-purple-100" indicatorClassName="bg-purple-500" />
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MiniStat label="Validations" value={stats.oracle.submissions.toString()} />
              <MiniStat label="Latency" value="120ms" />
              <MiniStat label="Anomalies" value="0" color="text-green-600" />
              <MiniStat label="Oracle Nodes" value="1 Active" />
           </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgramStatusCard({ title, programName, icon, metrics, status, color }: any) {
  const colorMap: any = {
    yellow: "text-yellow-600 bg-yellow-50 border-yellow-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
  };

  return (
    <Card className="border-border/60 hover:border-primary/30 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
      <CardContent className="p-0">
        <div className="p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", colorMap[color])}>
              {icon}
            </div>
            <div>
              <h3 className="text-sm font-bold leading-none">{title}</h3>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold">{programName}</p>
            </div>
          </div>
          <Badge className={cn("text-[9px] h-5", colorMap[color])}>{status}</Badge>
        </div>
        
        <div className="px-5 pb-5 space-y-4">
          {metrics.map((m: any, i: number) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{m.label}</span>
              <span className="text-xs font-bold font-mono">{m.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PulseMetric({ label, value, icon }: any) {
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase font-bold tracking-tighter">{label}</span>
      </div>
      <span className="text-sm font-mono font-black text-primary leading-none mt-0.5">{value}</span>
    </div>
  );
}

function MiniStat({ label, value, color }: any) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 border border-border/40">
      <p className="text-[9px] uppercase font-bold text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-sm font-mono font-bold", color || "text-foreground")}>{value}</p>
    </div>
  );
}

function StatItem({ label, value, icon, color }: any) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-sm font-mono font-bold", color)}>{value}</span>
    </div>
  );
}
