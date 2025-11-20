'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';

interface LiveTransactionStatsCardProps {
  // Add props as needed
}

export default function LiveTransactionStatsCard(props: LiveTransactionStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Transaction Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-primary text-2xl font-bold">Loading...</div>
            <div className="text-muted-foreground">Real-time transaction statistics</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
