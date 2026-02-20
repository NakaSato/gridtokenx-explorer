'use client';

import React, { useState } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Input } from '@/app/(shared)/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/(shared)/components/ui/select';
import {
  Key,
  Search,
  Copy,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import { PROGRAMS } from '../config';

interface PDALookupProps {
  findPDA: (programId: string, seeds: (string | Uint8Array)[]) => Promise<{ address: string; bump: number } | null>;
}

export function PDALookup({ findPDA }: PDALookupProps) {
  const [selectedProgram, setSelectedProgram] = useState<string>(PROGRAMS.trading.id);
  const [seeds, setSeeds] = useState<string[]>(['']);
  const [result, setResult] = useState<{ address: string; bump: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);

  const programEntries = Object.entries(PROGRAMS).map(([key, prog]) => ({
    id: prog.id,
    name: prog.name,
    key,
  }));

  const handleSearch = async () => {
    const validSeeds = seeds.filter(s => s.trim().length > 0);
    if (validSeeds.length === 0) return;

    setIsSearching(true);
    try {
      const res = await findPDA(selectedProgram, validSeeds);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const addSeed = () => setSeeds([...seeds, '']);
  const removeSeed = (index: number) => setSeeds(seeds.filter((_, i) => i !== index));
  const updateSeed = (index: number, value: string) => {
    const updated = [...seeds];
    updated[index] = value;
    setSeeds(updated);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Quick presets for known PDAs
  const presets = [
    { label: 'Market', program: PROGRAMS.trading.id, seeds: ['market'] },
    { label: 'Registry', program: PROGRAMS.registry.id, seeds: ['registry'] },
    { label: 'PoA Config', program: PROGRAMS.governance.id, seeds: ['poa_config'] },
    { label: 'Oracle Data', program: PROGRAMS.oracle.id, seeds: ['oracle_data'] },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setSelectedProgram(preset.program);
    setSeeds(preset.seeds);
    setResult(null);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Key className="h-4 w-4 text-amber-500" />
          PDA Lookup Tool
        </h3>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-1">
        <span className="text-[10px] text-muted-foreground self-center mr-1">Quick:</span>
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            className="h-6 text-[10px]"
            onClick={() => applyPreset(preset)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Program Selection */}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Program</label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {programEntries.map((prog) => (
                <SelectItem key={prog.id} value={prog.id} className="text-xs">
                  {prog.name} — {prog.id.slice(0, 12)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seeds */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-[10px] font-medium text-muted-foreground">Seeds</label>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px]" onClick={addSeed}>
              <Plus className="h-3 w-3" /> Add Seed
            </Button>
          </div>
          <div className="space-y-2">
            {seeds.map((seed, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge variant="outline" className="h-8 w-8 flex-shrink-0 justify-center text-[10px]">
                  {i + 1}
                </Badge>
                <Input
                  value={seed}
                  onChange={(e) => updateSeed(i, e.target.value)}
                  placeholder="Seed value (string or base58 pubkey)"
                  className="h-8 flex-1 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
                {seeds.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => removeSeed(i)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={isSearching || seeds.every(s => !s.trim())}
          className="w-full gap-2"
          size="sm"
        >
          <Search className="h-4 w-4" />
          {isSearching ? 'Deriving...' : 'Find PDA'}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground">Derived Address</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 text-[10px]"
              onClick={handleCopy}
            >
              {copied ? (
                <><CheckCircle2 className="h-3 w-3" /> Copied</>
              ) : (
                <><Copy className="h-3 w-3" /> Copy</>
              )}
            </Button>
          </div>
          <p className="mt-2 break-all font-mono text-sm font-semibold text-primary">
            {result.address}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">Bump: {result.bump}</Badge>
            <span className="text-[10px] text-muted-foreground">
              Seeds: [{seeds.filter(s => s.trim()).map(s => `"${s}"`).join(', ')}]
            </span>
          </div>
        </div>
      )}

      {result === null && !isSearching && seeds.some(s => s.trim()) && (
        <p className="text-center text-[10px] text-muted-foreground">
          Click "Find PDA" to derive the program address
        </p>
      )}
    </div>
  );
}
