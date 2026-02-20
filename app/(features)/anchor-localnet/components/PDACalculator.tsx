'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Button } from '@/app/(shared)/components/ui/button';
import { Input } from '@/app/(shared)/components/ui/input';
import { Label } from '@/app/(shared)/components/ui/label';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import { Key, Copy, Plus, Trash2, Calculator } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';

interface PDACalculatorProps {
  rpcUrl: string;
}

interface SeedInput {
  id: string;
  type: 'string' | 'pubkey';
  value: string;
}

const PDA_TEMPLATES = [
  { name: 'User Account', program: 'registry', seeds: [{ type: 'string', value: 'user' }, { type: 'pubkey', value: '' }] },
  { name: 'Meter Account', program: 'registry', seeds: [{ type: 'string', value: 'meter' }, { type: 'pubkey', value: '' }, { type: 'string', value: 'METER-001' }] },
  { name: 'Registry PDA', program: 'registry', seeds: [{ type: 'string', value: 'registry' }] },
  { name: 'Market PDA', program: 'trading', seeds: [{ type: 'string', value: 'market' }] },
  { name: 'PoA Config', program: 'governance', seeds: [{ type: 'string', value: 'poa_config' }] },
  { name: 'Oracle Data', program: 'oracle', seeds: [{ type: 'string', value: 'oracle_data' }] },
];

export function PDACalculator({ rpcUrl }: PDACalculatorProps) {
  const [programId, setProgramId] = useState<string>(PROGRAMS.registry.id);
  const [seeds, setSeeds] = useState<SeedInput[]>([
    { id: '1', type: 'string', value: '' },
  ]);
  const [result, setResult] = useState<{ address: string; bump: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addSeed = () => {
    setSeeds(prev => [...prev, { id: Date.now().toString(), type: 'string', value: '' }]);
  };

  const removeSeed = (id: string) => {
    setSeeds(prev => prev.filter(s => s.id !== id));
  };

  const updateSeed = (id: string, field: 'type' | 'value', value: string) => {
    setSeeds(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const loadTemplate = (template: typeof PDA_TEMPLATES[0]) => {
    setProgramId(PROGRAMS[template.program as keyof typeof PROGRAMS].id);
    setSeeds(template.seeds.map((s, i) => ({
      id: i.toString(),
      type: s.type as 'string' | 'pubkey',
      value: s.value
    })));
    setResult(null);
    setError(null);
  };

  const calculatePDA = () => {
    try {
      setError(null);

      const seedBuffers = seeds.map(seed => {
        if (seed.type === 'pubkey') {
          return new PublicKey(seed.value).toBuffer();
        }
        return Buffer.from(seed.value);
      });

      const [pda, bump] = PublicKey.findProgramAddressSync(
        seedBuffers,
        new PublicKey(programId)
      );

      setResult({ address: pda.toBase58(), bump });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input');
      setResult(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Key className="h-4 w-4 text-blue-500" />
          PDA Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Templates */}
        <div className="space-y-2">
          <Label className="text-xs">Quick Templates</Label>
          <ScrollArea className="h-[100px] rounded-md border p-2">
            <div className="flex flex-wrap gap-1">
              {PDA_TEMPLATES.map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={() => loadTemplate(template)}
                >
                  <Badge variant="outline" className="mr-1 text-[8px]">{template.program}</Badge>
                  {template.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Program ID */}
        <div className="space-y-2">
          <Label htmlFor="programId">Program ID</Label>
          <select
            id="programId"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Object.entries(PROGRAMS).map(([key, prog]) => (
              <option key={key} value={prog.id}>{prog.name}</option>
            ))}
          </select>
        </div>

        {/* Seeds */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Seeds</Label>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={addSeed}>
              <Plus className="h-3 w-3" /> Add Seed
            </Button>
          </div>
          <div className="space-y-2">
            {seeds.map((seed, index) => (
              <div key={seed.id} className="flex items-center gap-2">
                <select
                  value={seed.type}
                  onChange={(e) => updateSeed(seed.id, 'type', e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs w-24"
                >
                  <option value="string">String</option>
                  <option value="pubkey">Pubkey</option>
                </select>
                <Input
                  value={seed.value}
                  onChange={(e) => updateSeed(seed.id, 'value', e.target.value)}
                  placeholder={seed.type === 'pubkey' ? 'Public key...' : 'Seed value...'}
                  className="flex-1 text-xs"
                />
                {seeds.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => removeSeed(seed.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Calculate Button */}
        <Button onClick={calculatePDA} className="w-full gap-2">
          <Calculator className="h-4 w-4" />
          Calculate PDA
        </Button>

        {/* Result */}
        {result && (
          <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Address</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(result.address)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <code className="block text-xs font-mono break-all">{result.address}</code>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Bump: {result.bump}</span>
              <Badge variant="outline" className="text-[9px]">Verified</Badge>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
