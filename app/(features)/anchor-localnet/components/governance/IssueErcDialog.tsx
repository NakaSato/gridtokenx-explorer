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
import { Plus } from 'lucide-react';

interface IssueErcDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rpcUrl: string;
  onSuccess: () => void;
}

export function IssueErcDialog({ open, onOpenChange, rpcUrl, onSuccess }: IssueErcDialogProps) {
  const [certificateId, setCertificateId] = useState('');
  const [energyAmount, setEnergyAmount] = useState('1000');
  const [renewableSource, setRenewableSource] = useState('Solar');
  const [owner, setOwner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setTxSignature(null);

    try {
      const response = await fetch('/api/governance/issue-erc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: certificateId || `ERC-${Date.now()}`,
          energyAmount: parseInt(energyAmount),
          renewableSource,
          owner,
          validationData: '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to issue ERC');
      }

      const data = await response.json();
      setTxSignature(data.signature);

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setTxSignature(null);
        setCertificateId('');
        setEnergyAmount('1000');
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
            <Plus className="h-4 w-4" /> Issue ERC Certificate
          </DialogTitle>
          <DialogDescription>
            Create a new Renewable Energy Certificate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="owner">Owner (Wallet Address)</Label>
            <Input
              id="owner"
              placeholder="Enter wallet address"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="energyAmount">Energy Amount (kWh)</Label>
              <Input
                id="energyAmount"
                type="number"
                value={energyAmount}
                onChange={(e) => setEnergyAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={renewableSource}
                onChange={(e) => setRenewableSource(e.target.value)}
              />
            </div>
          </div>

          {txSignature && (
            <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700">
              ✅ ERC issued! TX: {txSignature.slice(0, 20)}...
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
          <Button onClick={handleSubmit} disabled={isSubmitting || !owner}>
            {isSubmitting ? 'Issuing...' : 'Issue Certificate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
