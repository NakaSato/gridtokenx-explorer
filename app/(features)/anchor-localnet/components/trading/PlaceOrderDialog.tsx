import React, { useState } from 'react';
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
import { Button } from '@/app/(shared)/components/ui/button';
import { Plus } from 'lucide-react';

interface PlaceOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rpcUrl: string;
  onSuccess: () => void;
}

export function PlaceOrderDialog({ open, onOpenChange, rpcUrl, onSuccess }: PlaceOrderDialogProps) {
  const [orderType, setOrderType] = useState('Buy');
  const [amount, setAmount] = useState('100');
  const [price, setPrice] = useState('5000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setTxSignature(null);

    try {
      const endpoint = orderType === 'Buy' ? '/api/trading/create-buy-order' : '/api/trading/create-sell-order';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          energyAmount: parseInt(amount),
          pricePerKwh: parseInt(price),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const data = await response.json();
      setTxSignature(data.signature);

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setTxSignature(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Plus className="h-5 w-5" /> Place Order
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new buy or sell order in the energy market.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="orderType" className="text-xs uppercase tracking-wider text-muted-foreground">Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className="border-primary/20 bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Buy">🟢 Buy Energy</SelectItem>
                <SelectItem value="Sell">🔴 Sell Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs uppercase tracking-wider text-muted-foreground">Energy Amount (kWh)</Label>
            <Input
              id="amount"
              type="number"
              className="font-mono border-primary/20 bg-background/50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-xs uppercase tracking-wider text-muted-foreground">Price per kWh (micro-units)</Label>
            <Input
              id="price"
              type="number"
              className="font-mono border-primary/20 bg-background/50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {txSignature && (
            <div className="rounded-lg bg-green-500/10 p-3 border border-green-500/20 text-xs text-green-600">
              <span className="font-semibold">✅ Order placed!</span> TX: <span className="font-mono">{txSignature.slice(0, 20)}...</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20 text-xs text-red-600">
              <span className="font-semibold">❌ Error:</span> {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="shadow-md hover:shadow-lg transition-all">
            {isSubmitting ? 'Placing...' : 'Submit Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
