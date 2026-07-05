import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Input } from '@/app/(shared)/components/ui/input';
import { Button } from '@/app/(shared)/components/ui/button';
import { Label } from '@/app/(shared)/components/ui/label';
import { Database, RefreshCw, Activity, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
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
    <div className="space-y-2 font-mono">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="rounded-none border-[#2a2a2a] bg-black">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-[#666]">
              <Activity className="h-3 w-3" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <p className="text-2xl font-bold text-[#9945FF]">{stats?.pending_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-[#14F195]/30 bg-[#14F195]/5">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-[#14F195]/80">
              <CheckCircle2 className="h-3 w-3" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <p className="text-2xl font-bold text-[#14F195]">{stats?.completed_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-[#ff3333]/30 bg-[#ff3333]/5">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-[#ff5555]/80">
              <XCircle className="h-3 w-3" /> Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <p className="text-2xl font-bold text-[#ff5555]">{stats?.failed_count ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-[#2a2a2a] bg-black">
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-[9px] uppercase tracking-wider text-[#666]">Value (THB)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <p className="text-2xl font-bold text-[#9945FF]">
              {stats?.total_settled_value.toFixed(2) ?? '0.00'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="border border-[#2a2a2a] bg-[#0a0a0a] p-4">
        <div className="mb-3">
          <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">
            <Database className="h-3.5 w-3.5" /> Admin Operations: Order Matching
          </h4>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[#666]">
            Trigger the matching engine manually to pair pending buy and sell orders.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="adminToken" className="text-[10px] uppercase tracking-wider text-[#666]">Admin Bearer Token</Label>
            <Input
              id="adminToken"
              type="password"
              placeholder="eyJhbGciOiJIUzI1..."
              className="rounded-none border-[#2a2a2a] bg-black font-mono text-[#e0e0e0] focus:border-[#9945FF]"
              value={adminToken}
              onChange={(e) => setAdminToken(e.target.value)}
            />
          </div>
          <Button
            className="w-full min-w-[140px] rounded-none bg-[#9945FF] text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#7d37d6] sm:w-auto"
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
