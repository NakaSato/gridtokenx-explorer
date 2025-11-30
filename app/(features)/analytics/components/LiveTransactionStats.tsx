'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { ClusterStatsStatus, usePerformanceInfo } from '@/app/(core)/providers/stats/solanaClusterStats';
import { abbreviatedNumber } from '@/app/(shared)/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function LiveTransactionStats() {
  const { status, perfHistory, avgTps, historyMaxTps, transactionCount } = usePerformanceInfo();

  if (status === ClusterStatsStatus.Loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Live Transaction Stats</CardTitle>
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
          <CardTitle className="text-base sm:text-lg">Live Transaction Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-destructive">
            Failed to load transaction stats
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for Chart.js with time-based labels
  const dataLength = perfHistory.short.length;
  const labels = perfHistory.short.map((_, index) => {
    const secondsAgo = (dataLength - 1 - index) * 30; // Assuming 30-second intervals
    if (secondsAgo === 0) return 'Now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    const remainingSeconds = secondsAgo % 60;
    if (remainingSeconds === 0) return `${minutesAgo}m ago`;
    return `${minutesAgo}m ${remainingSeconds}s ago`;
  }).reverse();

  const tpsData = perfHistory.short.map(tps => tps || 0).reverse();
  
  const data = {
    labels,
    datasets: [
      {
        label: 'TPS',
        data: tpsData,
        backgroundColor: '#9945FF',
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#9945FF',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          title: (context) => context[0].label,
          label: (context) => {
            const tps = context.parsed.y !== null ? Math.round(context.parsed.y) : 0;
            return `TPS: ${tps.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.6)',
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 5,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
    animation: {
        duration: 0 // Disable animation for real-time updates to prevent jitter
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Live Transaction Stats</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-3 sm:p-6">
        <div className="mb-4 grid grid-cols-1 gap-3 text-center xs:grid-cols-3 sm:mb-6 sm:gap-4">
          <div>
            <div className="text-xl font-bold text-primary sm:text-2xl">
              {avgTps ? Math.round(avgTps).toLocaleString() : '-'}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider sm:text-xs">Current TPS</div>
          </div>
          <div>
            <div className="text-xl font-bold text-primary sm:text-2xl">
              {historyMaxTps ? Math.round(historyMaxTps).toLocaleString() : '-'}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider sm:text-xs">Max TPS</div>
          </div>
          <div>
            <div className="text-xl font-bold text-primary sm:text-2xl">
              {transactionCount ? abbreviatedNumber(Number(transactionCount)) : '-'}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider sm:text-xs">Total Transactions</div>
          </div>
        </div>

        <div className="flex-1 min-h-[180px] w-full sm:min-h-[200px]">
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
