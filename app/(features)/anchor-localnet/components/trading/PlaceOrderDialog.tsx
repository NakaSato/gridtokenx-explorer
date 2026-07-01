'use client';

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
      <DialogContent className="rounded-none border-[#2a2a2a] bg-black font-mono sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">
            <Plus className="h-4 w-4" /> Place Order
          </DialogTitle>
          <DialogDescription className="text-[10px] uppercase tracking-wide text-[#666]">
            Create a new buy or sell order in the energy market.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="orderType" className="text-[10px] uppercase tracking-wider text-[#666]">Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className="rounded-none border-[#2a2a2a] bg-[#0a0a0a] text-[#e0e0e0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-[#2a2a2a] bg-black font-mono text-[#e0e0e0]">
                <SelectItem value="Buy">🟢 Buy Energy</SelectItem>
                <SelectItem value="Sell">🔴 Sell Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-[10px] uppercase tracking-wider text-[#666]">Energy Amount (kWh)</Label>
            <Input
              id="amount"
              type="number"
              className="rounded-none border-[#2a2a2a] bg-[#0a0a0a] font-mono text-[#e0e0e0] focus:border-[#9945FF]"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-[10px] uppercase tracking-wider text-[#666]">Price per kWh (micro-units)</Label>
            <Input
              id="price"
              type="number"
              className="rounded-none border-[#2a2a2a] bg-[#0a0a0a] font-mono text-[#e0e0e0] focus:border-[#9945FF]"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {txSignature && (
            <div className="border border-[#14F195]/30 bg-[#14F195]/10 p-3 text-[10px] text-[#14F195]">
              <span className="font-bold">✅ Order placed!</span> TX: <span>{txSignature.slice(0, 20)}...</span>
            </div>
          )}

          {error && (
            <div className="border border-[#ff3333]/30 bg-[#ff3333]/10 p-3 text-[10px] text-[#ff5555]">
              <span className="font-bold">❌ Error:</span> {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="rounded-none text-[10px] uppercase tracking-wider text-[#888] hover:bg-[#1a1a1a] hover:text-[#e0e0e0]">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-none bg-[#9945FF] text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#7d37d6]">
            {isSubmitting ? 'Placing...' : 'Submit Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
