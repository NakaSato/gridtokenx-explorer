'use client';

import { Button } from '@/app/(shared)/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Input } from '@/app/(shared)/components/ui/input';
import { Alert, AlertDescription } from '@/app/(shared)/components/ui/alert';
import React from 'react';

interface ProgramMonitorCardProps {
  customProgramId: string;
  onProgramIdChange: (value: string) => void;
  onMonitor: () => void;
}

export function ProgramMonitorCard({ customProgramId, onProgramIdChange, onMonitor }: ProgramMonitorCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Monitor Your P2P Energy Trading Platform</CardTitle>
        <CardDescription className="text-base">
          Enter your Anchor program ID to monitor transactions specific to your energy trading platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter your program ID (e.g., YourProgramId...)"
              value={customProgramId}
              onChange={e => onProgramIdChange(e.target.value)}
              className="h-11"
            />
          </div>
          <Button className="h-11 px-6 md:w-auto" onClick={onMonitor}>
            Monitor Program
          </Button>
        </div>
        {customProgramId && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertDescription className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-600" />
              <span>
                <strong>Monitoring:</strong> {customProgramId}
              </span>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
