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
      <DialogContent className="rounded-none border-[#2a2a2a] bg-black font-mono sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#9945FF]">
            <Plus className="h-4 w-4" /> Issue ERC Certificate
          </DialogTitle>
          <DialogDescription className="text-[10px] uppercase tracking-wide text-[#666]">
            Create a new Renewable Energy Certificate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="owner" className="text-[10px] uppercase tracking-wider text-[#666]">Owner (Wallet Address)</Label>
            <Input
              id="owner"
              placeholder="Enter wallet address"
              className="rounded-none border-[#2a2a2a] bg-black text-[#e0e0e0] focus:border-[#9945FF]"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="energyAmount" className="text-[10px] uppercase tracking-wider text-[#666]">Energy Amount (kWh)</Label>
              <Input
                id="energyAmount"
                type="number"
                className="rounded-none border-[#2a2a2a] bg-black text-[#e0e0e0] focus:border-[#9945FF]"
                value={energyAmount}
                onChange={(e) => setEnergyAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source" className="text-[10px] uppercase tracking-wider text-[#666]">Source</Label>
              <Input
                id="source"
                className="rounded-none border-[#2a2a2a] bg-black text-[#e0e0e0] focus:border-[#9945FF]"
                value={renewableSource}
                onChange={(e) => setRenewableSource(e.target.value)}
              />
            </div>
          </div>

          {txSignature && (
            <div className="border border-[#14F195]/40 bg-[#14F195]/10 p-3 text-[10px] uppercase tracking-wide text-[#14F195]">
              ERC issued! TX: {txSignature.slice(0, 20)}...
            </div>
          )}

          {error && (
            <div className="border border-[#ff3333]/40 bg-[#ff3333]/10 p-3 text-[10px] uppercase tracking-wide text-[#ff5555]">
              Error: {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-none text-[#888] hover:text-[#e0e0e0]" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button className="rounded-none bg-[#9945FF] text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#7d37d6]" onClick={handleSubmit} disabled={isSubmitting || !owner}>
            {isSubmitting ? 'Issuing...' : 'Issue Certificate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
