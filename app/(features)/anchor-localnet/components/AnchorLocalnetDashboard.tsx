'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/(shared)/components/ui/tabs';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import {
  Anchor,
  BarChart3,
  CheckCircle2,
  Database,
  Gavel,
  Key,
  Radio,
  RefreshCw,
  ScrollText,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCluster } from '@/app/(core)/providers/cluster';
import { Cluster } from '@/app/(shared)/utils/cluster';
import { useAnchorLocalnet } from '../hooks/useAnchorLocalnet';
import { PROGRAMS } from '../config';
import { ProgramOverview } from './ProgramOverview'
import { TradingExplorer } from './TradingExplorer'
import { GovernanceExplorer } from './GovernanceExplorer';
import { OracleExplorer } from './OracleExplorer';
import { RegistryExplorer } from './RegistryExplorer';
import { TransactionLog } from './TransactionLog';
import { TransactionBuilder } from './TransactionBuilder';
import { PDACalculator } from './PDACalculator';
import { TokenBalancesPanel } from './TokenBalancesPanel';
import { PDALookup } from './PDALookup';

export function AnchorLocalnetDashboard() {
  const { cluster, url } = useCluster();
  const isLocalnet = cluster === Cluster.Localnet;
  const {
    overview, recentTxs, isLoading, error,
    fetchOverview, fetchProgramAccounts,
    fetchTransactionLogs, findPDA, getConnection,
  } = useAnchorLocalnet(url, isLocalnet);

  const [activeTab, setActiveTab] = useState('overview');

  // Only show on Localnet - after all hooks
  if (!isLocalnet) {
    return null;
  }

  if (isLoading && !overview) {
    return (
      <Card className="mb-4 w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Anchor className="h-5 w-5 animate-pulse" />
            Connecting to Anchor Localnet...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalAccounts = overview?.programs.reduce((sum, p) => sum + p.accountCount, 0) ?? 0;
  const deployedCount = overview?.programs.filter(p => p.deployed).length ?? 0;

  return (
    <Card className="mb-4 w-full border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Anchor className="h-5 w-5 text-primary" />
            GridTokenX Anchor Explorer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={overview?.isRunning ? 'default' : 'destructive'} className="gap-1">
              {overview?.isRunning ? (
                <><CheckCircle2 className="h-3 w-3" /> Running</>
              ) : (
                <><XCircle className="h-3 w-3" /> Stopped</>
              )}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchOverview}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cluster Status Bar */}
        {overview?.isRunning && (
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 md:grid-cols-6">
            <StatCard label="Slot" value={overview.slot.toLocaleString()} />
            <StatCard label="Block Height" value={overview.blockHeight.toLocaleString()} />
            <StatCard label="Epoch" value={String(overview.epoch)} />
            <StatCard label="TPS" value={String(overview.tps)} />
            <StatCard label="Programs" value={`${deployedCount}/6`} />
            <StatCard label="Accounts" value={totalAccounts.toLocaleString()} />
          </div>
        )}

        {!overview?.isRunning && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-center">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Localnet is not running. Start it with:
            </p>
            <code className="mt-2 block rounded bg-background/50 px-2 py-1 font-mono text-xs">
              anchor localnet
            </code>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full h-10 gap-1 overflow-x-auto scrollbar-hide">
            <TabsTrigger value="overview" className="gap-1.5 text-xs px-3 whitespace-nowrap">
              <BarChart3 className="h-3.5 w-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="trading" className="gap-1.5 text-xs px-3 whitespace-nowrap">
              <Zap className="h-3.5 w-3.5" /> Trading
            </TabsTrigger>
            <TabsTrigger value="governance" className="gap-1.5 text-xs px-3 whitespace-nowrap">
              <Gavel className="h-3.5 w-3.5" /> Governance
            </TabsTrigger>
            <TabsTrigger value="oracle" className="gap-1.5 text-xs px-3 whitespace-nowrap">
              <Radio className="h-3.5 w-3.5" /> Oracle
            </TabsTrigger>
            <TabsTrigger value="registry" className="gap-1.5 text-xs px-3 whitespace-nowrap">
              <Database className="h-3.5 w-3.5" /> Registry
            </TabsTrigger>
            <TabsTrigger value="txs" className="gap-1.5 text-xs px-3 whitespace-nowrap">
              <ScrollText className="h-3.5 w-3.5" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="pda" className="gap-1.5 text-xs px-3 whitespace-nowrap">
              <Key className="h-3.5 w-3.5" /> PDA
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-1.5 text-xs px-3 whitespace-nowrap">
              <Wrench className="h-3.5 w-3.5" /> Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProgramOverview
              programs={overview?.programs ?? []}
              onSelectProgram={(name) => {
                const tabMap: Record<string, string> = {
                  'Trading': 'trading',
                  'Energy Token': 'trading',
                  'Governance': 'governance',
                  'Oracle': 'oracle',
                  'Registry': 'registry',
                  'Blockbench': 'overview',
                };
                setActiveTab(tabMap[name] ?? 'overview');
              }}
            />
          </TabsContent>

          <TabsContent value="trading">
            <TradingExplorer
              rpcUrl={url}
              getConnection={getConnection}
              fetchProgramAccounts={fetchProgramAccounts}
            />
          </TabsContent>

          <TabsContent value="governance">
            <GovernanceExplorer rpcUrl={url} getConnection={getConnection} />
          </TabsContent>

          <TabsContent value="oracle">
            <OracleExplorer rpcUrl={url} getConnection={getConnection} />
          </TabsContent>

          <TabsContent value="registry">
            <RegistryExplorer rpcUrl={url} getConnection={getConnection} />
          </TabsContent>

          <TabsContent value="txs">
            <TransactionLog
              transactions={recentTxs}
              fetchLogs={fetchTransactionLogs}
            />
          </TabsContent>

          <TabsContent value="pda">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PDALookup findPDA={findPDA} />
              <PDACalculator rpcUrl={url} />
            </div>
          </TabsContent>

          <TabsContent value="tools">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TransactionBuilder rpcUrl={url} getConnection={getConnection} />
              <TokenBalancesPanel rpcUrl={url} getConnection={getConnection} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}

export default AnchorLocalnetDashboard;
