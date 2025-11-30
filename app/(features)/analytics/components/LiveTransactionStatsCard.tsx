'use client';

import { ResponsiveBar } from '@nivo/bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { useNivoTheme } from '@/app/(shared)/components/useNivoTheme';
import { ClusterStatsStatus, usePerformanceInfo } from '@/app/(core)/providers/stats/solanaClusterStats';
import { abbreviatedNumber } from '@/app/(shared)/utils';

export default function LiveTransactionStatsCard() {
  const { status, perfHistory, avgTps, historyMaxTps, transactionCount } = usePerformanceInfo();
  const nivoTheme = useNivoTheme();

  if (status === ClusterStatsStatus.Loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Transaction Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === ClusterStatsStatus.Error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Transaction Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-destructive">
            Failed to load transaction stats
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for Nivo Bar chart
  const data = perfHistory.short.map((tps, index) => ({
    id: index,
    tps: tps || 0,
  })).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Transaction Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {avgTps ? Math.round(avgTps).toLocaleString() : '-'}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Current TPS</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {historyMaxTps ? Math.round(historyMaxTps).toLocaleString() : '-'}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Max TPS</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {transactionCount ? abbreviatedNumber(Number(transactionCount)) : '-'}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Transactions</div>
          </div>
        </div>

        <div className="h-[200px] w-full">
          <ResponsiveBar
            data={data}
            keys={['tps']}
            indexBy="id"
            margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={['hsl(var(--primary))']}
            borderRadius={4}
            theme={nivoTheme}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 0,
              tickPadding: 12,
              tickRotation: 0,
              legend: 'Time (30m)',
              legendPosition: 'middle',
              legendOffset: 32,
              format: () => '', // Hide specific labels for cleaner look
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 12,
              tickRotation: 0,
              legend: 'TPS',
              legendPosition: 'middle',
              legendOffset: -40,
            }}
            enableLabel={false}
            role="application"
            ariaLabel="Live Transaction Stats Bar Chart"
            barAriaLabel={e => `${e.id}: ${e.formattedValue} in TPS: ${e.indexValue}`}
            tooltip={({ value }) => (
              <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 shadow-sm">
                <div className="text-sm font-semibold">TPS: {value}</div>
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
