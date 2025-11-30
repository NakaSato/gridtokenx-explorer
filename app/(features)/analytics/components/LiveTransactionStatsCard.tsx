'use client';

import { ResponsiveLine } from '@nivo/line';
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

  // Prepare data for Nivo Line chart
  const data = [
    {
      id: 'tps',
      data: perfHistory.short
        .map((tps, index) => ({
          x: index,
          y: tps || 0,
        }))
        .reverse(),
    },
  ];

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
          <ResponsiveLine
            data={data}
            margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
            xScale={{ type: 'point' }}
            yScale={{
              type: 'linear',
              min: 'auto',
              max: 'auto',
              stacked: true,
              reverse: false,
            }}
            yFormat=" >-.2f"
            curve="monotoneX"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Time (30m)',
              legendOffset: 36,
              legendPosition: 'middle',
              format: () => '', // Hide labels for cleaner look
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'TPS',
              legendOffset: -40,
              legendPosition: 'middle',
            }}
            enableGridX={false}
            enablePoints={false}
            useMesh={true}
            enableArea={true}
            colors={{ scheme: 'category10' }}
            theme={nivoTheme}
            role="application"
            ariaLabel="Live Transaction Stats Line Chart"
          />
        </div>
      </CardContent>
    </Card>
  );
}
