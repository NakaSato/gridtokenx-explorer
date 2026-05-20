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
import { Button } from '@/app/(shared)/components/ui/button';
import { Input } from '@/app/(shared)/components/ui/input';
import { Label } from '@/app/(shared)/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(shared)/components/ui/select';
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Place Order
          </DialogTitle>
          <DialogDescription>
            Create a buy or sell order in the energy market.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="orderType">Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger id="orderType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Buy">Buy Order</SelectItem>
                <SelectItem value="Sell">Sell Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Energy (kWh)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price (THB/kWh)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          {txSignature && (
            <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700">
              ✅ Order placed! TX: {txSignature.slice(0, 20)}...
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Placing...' : 'Place Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
