import React, { useState } from 'react';
import { Button } from '@/app/(shared)/components/ui/button';
import { Input } from '@/app/(shared)/components/ui/input';
import { Label } from '@/app/(shared)/components/ui/label';
import { Database } from 'lucide-react';
import { toast } from 'sonner';
import { tradingApi, type P2PCostResponse } from '../../services/trading-api';

export function P2PCostEstimator() {
  const [params, setParams] = useState({
    buyerZoneId: 1,
    sellerZoneId: 1,
    energyAmount: 10,
    agreedPrice: 0.5,
  });
  const [result, setResult] = useState<P2PCostResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculate = async () => {
    setIsCalculating(true);
    try {
      const res = await tradingApi.calculateP2PCost(params);
      setResult(res);
    } catch (err) {
      toast.error('Failed to calculate P2P cost');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-md transition-all hover:bg-primary/10">
      <h4 className="mb-4 text-sm font-semibold flex items-center gap-2 text-primary">
        <Database className="h-4 w-4" /> P2P Cost Estimator
      </h4>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Energy (kWh)</Label>
            <Input
              type="number"
              className="h-9 text-sm font-mono border-primary/20 bg-background/50"
              value={params.energyAmount}
              onChange={(e) => setParams({ ...params, energyAmount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Price (THB/kWh)</Label>
            <Input
              type="number"
              step="0.1"
              className="h-9 text-sm font-mono border-primary/20 bg-background/50"
              value={params.agreedPrice}
              onChange={(e) => setParams({ ...params, agreedPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
        <Button className="w-full shadow-sm hover:shadow-md transition-all" variant="outline" onClick={calculate} disabled={isCalculating}>
          {isCalculating ? 'Calculating...' : 'Estimate Total Cost'}
        </Button>

        {result && (
          <div className="mt-4 space-y-2 rounded-lg border border-primary/20 bg-background/80 p-3 text-xs shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Energy Cost:</span>
              <span className="font-mono font-medium text-foreground">{parseFloat(result.energy_cost).toFixed(2)} THB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Transmission Fee:</span>
              <span className="font-mono font-medium text-foreground">{parseFloat(result.transmission_fee).toFixed(2)} THB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Platform Fee:</span>
              <span className="font-mono font-medium text-foreground">{parseFloat(result.platform_fee).toFixed(2)} THB</span>
            </div>
            <div className="mt-2 flex justify-between items-center border-t border-primary/10 pt-2 text-sm font-bold">
              <span>Total Cost:</span>
              <span className="font-mono text-primary">{parseFloat(result.total_cost).toFixed(2)} THB</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
