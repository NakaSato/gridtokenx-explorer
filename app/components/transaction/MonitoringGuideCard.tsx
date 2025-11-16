'use client';

import { Alert, AlertDescription } from '@components/shared/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/shared/ui/card';
import React from 'react';

export function MonitoringGuideCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">P2P Energy Trading Platform Monitoring</CardTitle>
        <CardDescription className="text-base">
          This page is designed to help you monitor your Anchor-based P2P energy trading platform on Solana. You can
          view real-time transactions and inspect deep details including:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="text-muted-foreground space-y-3">
          <li className="flex items-start gap-3">
            <span className="bg-primary mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" />
            <div>
              <strong className="text-foreground">Program Instructions:</strong> See all program invocations in each
              transaction
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-primary mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" />
            <div>
              <strong className="text-foreground">Account Changes:</strong> Monitor which accounts were read/written
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-primary mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" />
            <div>
              <strong className="text-foreground">Compute Units:</strong> Track computational resources used
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-primary mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" />
            <div>
              <strong className="text-foreground">Transaction Fees:</strong> View the cost of each transaction in
              lamports
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-primary mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" />
            <div>
              <strong className="text-foreground">Anchor Program Data:</strong> Deep inspection of your custom program
              interactions
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="bg-primary mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full" />
            <div>
              <strong className="text-foreground">Energy Trading Events:</strong> Monitor trades, settlements, and
              platform activity
            </div>
          </li>
        </ul>
        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
          <AlertDescription className="text-sm leading-relaxed">
            <strong>💡 Pro Tip:</strong> Enter your program ID above to filter transactions specific to your energy
            trading platform. Click &quot;Inspect&quot; on any transaction to see full details including all accounts,
            instructions, and program logs.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
