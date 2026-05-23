import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Input } from '@/app/(shared)/components/ui/input';
import { Button } from '@/app/(shared)/components/ui/button';
import { Label } from '@/app/(shared)/components/ui/label';
import { Database, RefreshCw, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { tradingApi } from '../../services/trading-api';
import type { SettlementStats as ISettlementStats } from '../../services/trading-api';

interface SettlementStatsProps {
  stats: ISettlementStats | null;
  onMatchSuccess: () => void;
}

export function SettlementStats({ stats, onMatchSuccess }: SettlementStatsProps) {
  const [adminToken, setAdminToken] = useState('');
  const [isMatching, setIsMatching] = useState(false);

  const handleMatchOrders = async () => {
    if (!adminToken) {
      toast.error('Please enter an Admin Bearer Token');
      return;
    }

    setIsMatching(true);
    try {
      const result = await tradingApi.triggerMatchingEngine(adminToken);
      toast.success(result.message);
      setTimeout(onMatchSuccess, 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to trigger matching engine');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-primary/20 bg-background/60 backdrop-blur-md">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
              <Activity className="h-3 w-3" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="font-mono text-2xl font-bold text-foreground">{stats?.pending_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5 backdrop-blur-md">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-[10px] uppercase text-green-600/80">
              <CheckCircle2 className="h-3 w-3" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 text-green-600">
            <p className="font-mono text-2xl font-bold">{stats?.completed_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-md">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="flex items-center gap-2 text-[10px] uppercase text-red-600/80">
              <XCircle className="h-3 w-3" /> Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 text-red-600">
            <p className="font-mono text-2xl font-bold">{stats?.failed_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-background/60 backdrop-blur-md">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-[10px] uppercase text-muted-foreground">Value (THB)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="font-mono text-2xl font-bold text-primary">
              {stats?.total_settled_value.toFixed(2) ?? '0.00'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-primary/20 bg-muted/20 p-6 backdrop-blur-md">
        <div className="mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Database className="h-4 w-4 text-primary" /> Admin Operations: Order Matching
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Trigger the matching engine manually to pair pending buy and sell orders.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="space-y-1.5 flex-1">
            <Label htmlFor="adminToken" className="text-xs text-muted-foreground">Admin Bearer Token</Label>
            <Input
              id="adminToken"
              type="password"
              placeholder="eyJhbGciOiJIUzI1..."
              className="font-mono border-primary/20 bg-background/50 focus:bg-background"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
            />
          </div>
          <Button
            className="w-full sm:w-auto min-w-[140px] shadow-sm hover:shadow-md transition-all"
            disabled={isMatching || !adminToken}
            onClick={handleMatchOrders}
          >
            {isMatching ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isMatching ? 'Processing...' : 'Trigger Match'}
          </Button>
        </div>
      </div>
    </div>
  );
}
