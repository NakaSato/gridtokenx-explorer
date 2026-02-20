'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
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
import { Badge } from '@/app/(shared)/components/ui/badge';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import { Wrench, Send, Plus, Minus, AlertCircle } from 'lucide-react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { PROGRAMS } from '../config';

interface TransactionBuilderProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface InstructionField {
  name: string;
  type: 'string' | 'number' | 'pubkey' | 'enum';
  required: boolean;
  value: string;
}

interface InstructionConfig {
  name: string;
  program: string;
  fields: InstructionField[];
}

const AVAILABLE_INSTRUCTIONS: InstructionConfig[] = [
  {
    name: 'register_user',
    program: 'registry',
    fields: [
      { name: 'user_type', type: 'enum', required: true, value: 'Prosumer' },
      { name: 'lat', type: 'number', required: true, value: '13.7563' },
      { name: 'lng', type: 'number', required: true, value: '100.5018' },
    ],
  },
  {
    name: 'register_meter',
    program: 'registry',
    fields: [
      { name: 'meter_id', type: 'string', required: true, value: '' },
      { name: 'meter_type', type: 'enum', required: true, value: 'Solar' },
    ],
  },
  {
    name: 'update_meter_reading',
    program: 'registry',
    fields: [
      { name: 'energy_generated', type: 'number', required: true, value: '5000' },
      { name: 'energy_consumed', type: 'number', required: true, value: '2300' },
    ],
  },
  {
    name: 'create_buy_order',
    program: 'trading',
    fields: [
      { name: 'energy_amount', type: 'number', required: true, value: '100' },
      { name: 'price_per_kwh', type: 'number', required: true, value: '5000' },
    ],
  },
  {
    name: 'create_sell_order',
    program: 'trading',
    fields: [
      { name: 'energy_amount', type: 'number', required: true, value: '100' },
      { name: 'price_per_kwh', type: 'number', required: true, value: '5000' },
    ],
  },
  {
    name: 'issue_erc',
    program: 'governance',
    fields: [
      { name: 'certificate_id', type: 'string', required: true, value: '' },
      { name: 'energy_amount', type: 'number', required: true, value: '1000' },
      { name: 'renewable_source', type: 'enum', required: true, value: 'Solar' },
    ],
  },
  {
    name: 'submit_meter_reading',
    program: 'oracle',
    fields: [
      { name: 'meter_id', type: 'string', required: true, value: '' },
      { name: 'energy_produced', type: 'number', required: true, value: '5000' },
      { name: 'energy_consumed', type: 'number', required: true, value: '2300' },
    ],
  },
];

export function TransactionBuilder({ rpcUrl, getConnection }: TransactionBuilderProps) {
  const [selectedInstruction, setSelectedInstruction] = useState<string>('');
  const [fields, setFields] = useState<InstructionField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInstructionChange = (value: string) => {
    setSelectedInstruction(value);
    const config = AVAILABLE_INSTRUCTIONS.find(i => i.name === value);
    if (config) {
      setFields(config.fields.map(f => ({ ...f })));
    }
    setResult(null);
  };

  const updateField = (index: number, value: string) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, value } : f));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setResult(null);

    try {
      const config = AVAILABLE_INSTRUCTIONS.find(i => i.name === selectedInstruction);
      if (!config) throw new Error('Invalid instruction');

      // Build API endpoint
      const endpoint = `/api/${config.program}/${selectedInstruction.replace(/_/g, '-')}`;
      
      // Build request body
      const body: Record<string, unknown> = {};
      fields.forEach(field => {
        if (field.type === 'number') {
          body[field.name] = parseFloat(field.value);
        } else {
          body[field.name] = field.value;
        }
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to execute ${selectedInstruction}`);
      }

      const data = await response.json();
      setResult({
        success: true,
        message: `Transaction sent! Signature: ${data.signature?.slice(0, 20)}...`,
      });
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wrench className="h-4 w-4 text-orange-500" />
          Transaction Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="instruction">Instruction</Label>
          <Select value={selectedInstruction} onValueChange={handleInstructionChange}>
            <SelectTrigger id="instruction">
              <SelectValue placeholder="Select an instruction" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_INSTRUCTIONS.map((inst) => (
                <SelectItem key={inst.name} value={inst.name}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]">{inst.program}</Badge>
                    <span>{inst.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {fields.length > 0 && (
          <ScrollArea className="h-[200px] rounded-md border p-3">
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.name} className="space-y-1">
                  <Label htmlFor={field.name} className="text-xs">
                    {field.name}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === 'enum' ? (
                    <Select value={field.value} onValueChange={(v) => updateField(index, v)}>
                      <SelectTrigger id={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field.name === 'user_type' && (
                          <>
                            <SelectItem value="Prosumer">Prosumer</SelectItem>
                            <SelectItem value="Consumer">Consumer</SelectItem>
                          </>
                        )}
                        {field.name === 'meter_type' && (
                          <>
                            <SelectItem value="Solar">Solar</SelectItem>
                            <SelectItem value="Wind">Wind</SelectItem>
                            <SelectItem value="Battery">Battery</SelectItem>
                            <SelectItem value="Grid">Grid</SelectItem>
                          </>
                        )}
                        {field.name === 'renewable_source' && (
                          <>
                            <SelectItem value="Solar">Solar</SelectItem>
                            <SelectItem value="Wind">Wind</SelectItem>
                            <SelectItem value="Hydro">Hydro</SelectItem>
                            <SelectItem value="Geothermal">Geothermal</SelectItem>
                            <SelectItem value="Biomass">Biomass</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={field.value}
                      onChange={(e) => updateField(index, e.target.value)}
                      placeholder={field.name}
                    />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {result && (
          <div className={`rounded-lg p-3 text-xs ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <div className="flex items-center gap-2">
              {result.success ? <Send className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {result.message}
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedInstruction}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Transaction'}
        </Button>
      </CardContent>
    </Card>
  );
}
