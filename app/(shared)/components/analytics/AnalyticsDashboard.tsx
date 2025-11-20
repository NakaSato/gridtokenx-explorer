// Advanced analytics dashboard integrating all services
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { AnalyticsChart, ChartData } from '../charts/AnalyticsChart';
import { useSearch, SearchResult } from '../../services/search';
import { useExport } from '../../services/export';
import { useCache, CacheStats } from '../../services/cache';
import { usePerformanceMonitor, PerformanceAlert } from '../../services/performance';
import { blockchainRealtimeService } from '../../services/realtime';

interface AnalyticsDashboardProps {
  initialTimeRange?: '1h' | '24h' | '7d' | '30d';
  showRealtime?: boolean;
  enableExport?: boolean;
}

export function AnalyticsDashboard({
  initialTimeRange = '24h',
  showRealtime = true,
  enableExport = true,
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState(['transactions', 'blocks', 'fees']);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(showRealtime);

  // Analytics data state
  const [transactionData, setTransactionData] = useState<ChartData[]>([]);
  const [blockData, setBlockData] = useState<ChartData[]>([]);
  const [feeData, setFeeData] = useState<ChartData[]>([]);
  const [networkStats, setNetworkStats] = useState<any>({});

  // Service integrations
  const {
    results: searchResults,
    loading: searchLoading,
    search,
  } = useSearch({
    query: searchQuery,
    type: 'all',
    limit: 10,
  });

  const { exportData, isExporting, exportProgress } = useExport();
  const {
    data: cacheData,
    stats: cacheStats,
    clear: clearCache,
  } = useCache(
    'analytics-dashboard',
    () => fetchAnalyticsData(timeRange),
    { ttl: 5 * 60 * 1000 }, // 5 minutes
  );

  const { trackInteraction, getMetrics, getAlerts } = usePerformanceMonitor('AnalyticsDashboard');

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async (range: string) => {
    try {
      // In a real implementation, this would fetch from your API
      const mockData = generateMockAnalyticsData(range);
      setTransactionData(mockData.transactions);
      setBlockData(mockData.blocks);
      setFeeData(mockData.fees);
      setNetworkStats(mockData.networkStats);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    }
  }, []);

  // Generate mock analytics data
  const generateMockAnalyticsData = (range: string) => {
    const now = Date.now();
    const intervals = getIntervalsForRange(range);

    const transactions = intervals.map((timestamp, index) => ({
      label: new Date(timestamp).toLocaleTimeString(),
      value: Math.floor(Math.random() * 1000) + 500,
      timestamp: new Date(timestamp),
    }));

    const blocks = intervals.map((timestamp, index) => ({
      label: new Date(timestamp).toLocaleTimeString(),
      value: Math.floor(Math.random() * 50) + 40,
      timestamp: new Date(timestamp),
    }));

    const fees = intervals.map((timestamp, index) => ({
      label: new Date(timestamp).toLocaleTimeString(),
      value: Math.floor(Math.random() * 100) + 10,
      timestamp: new Date(timestamp),
    }));

    const networkStats = {
      tps: (Math.random() * 3000 + 1000).toFixed(0),
      activeValidators: Math.floor(Math.random() * 100) + 1800,
      networkUptime: '99.9%',
      averageBlockTime: (Math.random() * 100 + 400).toFixed(0),
    };

    return { transactions, blocks, fees, networkStats };
  };

  // Get time intervals for range
  const getIntervalsForRange = (range: string): number[] => {
    const now = Date.now();
    const intervals: number[] = [];

    switch (range) {
      case '1h':
        for (let i = 12; i >= 0; i--) {
          intervals.push(now - i * 5 * 60 * 1000); // 5-minute intervals
        }
        break;
      case '24h':
        for (let i = 24; i >= 0; i--) {
          intervals.push(now - i * 60 * 60 * 1000); // 1-hour intervals
        }
        break;
      case '7d':
        for (let i = 7 * 24; i >= 0; i--) {
          intervals.push(now - i * 60 * 60 * 1000); // 1-hour intervals
        }
        break;
      case '30d':
        for (let i = 30; i >= 0; i--) {
          intervals.push(now - i * 24 * 60 * 60 * 1000); // 1-day intervals
        }
        break;
    }

    return intervals;
  };

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      trackInteraction('search', 'search-input');
    },
    [trackInteraction],
  );

  // Handle export
  const handleExport = useCallback(
    (format: 'csv' | 'json' | 'xlsx' | 'pdf') => {
      const exportData = {
        transactions: transactionData,
        blocks: blockData,
        fees: feeData,
        networkStats,
        timestamp: new Date().toISOString(),
      };

      exportData(exportData, { format, filename: `analytics-${timeRange}` });
      trackInteraction('export', `export-${format}`);
    },
    [exportData, transactionData, blockData, feeData, networkStats, timeRange, trackInteraction],
  );

  // Toggle realtime updates
  const toggleRealtime = useCallback(() => {
    setIsRealtimeEnabled(prev => !prev);
    if (isRealtimeEnabled) {
      blockchainRealtimeService.disconnect();
    } else {
      blockchainRealtimeService.connect();
    }
    trackInteraction('toggle-realtime');
  }, [isRealtimeEnabled, trackInteraction]);

  // Initialize data
  useEffect(() => {
    fetchAnalyticsData(timeRange);
  }, [timeRange, fetchAnalyticsData]);

  // Setup realtime updates
  useEffect(() => {
    if (isRealtimeEnabled) {
      blockchainRealtimeService.subscribeToTransactionUpdates(data => {
        // Update transaction data with new transaction
        setTransactionData(prev => {
          const newPoint: ChartData = {
            label: new Date().toLocaleTimeString(),
            value: data.transactionCount || prev[prev.length - 1]?.value || 0,
            timestamp: new Date(),
          };
          return [...prev.slice(1), newPoint];
        });
      });
    }

    return () => {
      if (isRealtimeEnabled) {
        blockchainRealtimeService.disconnect();
      }
    };
  }, [isRealtimeEnabled]);

  const metrics = getMetrics();
  const alerts = getAlerts();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time blockchain analytics and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant={isRealtimeEnabled ? 'default' : 'outline'} size="sm" onClick={toggleRealtime}>
            {isRealtimeEnabled ? '🔴 Live' : '⚫ Offline'}
          </Button>
        </div>
      </div>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-800">Performance Alerts ({alerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className={alert.type === 'error' ? 'text-red-600' : 'text-yellow-600'}>{alert.message}</span>
                  <Badge variant="outline" className="text-xs">
                    {alert.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.tps}</div>
            <p className="text-muted-foreground text-xs">Transactions per second</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Validators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.activeValidators}</div>
            <p className="text-muted-foreground text-xs">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Network Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.networkUptime}</div>
            <p className="text-muted-foreground text-xs">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Block Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.averageBlockTime}ms</div>
            <p className="text-muted-foreground text-xs">Block production time</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search transactions, blocks, accounts..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {enableExport && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={isExporting}>
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('json')} disabled={isExporting}>
                  Export JSON
                </Button>
                <Button variant="outline" size="sm" onClick={clearCache}>
                  Clear Cache
                </Button>
              </div>
            )}
          </div>

          {searchLoading && <div className="text-muted-foreground mt-2 text-sm">Searching...</div>}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between rounded border p-2">
                  <div>
                    <div className="font-medium">{result.title}</div>
                    <div className="text-muted-foreground text-sm">{result.description}</div>
                  </div>
                  <Badge variant="outline">{result.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <AnalyticsChart
            title="Transaction Volume"
            data={transactionData}
            type="line"
            height={300}
            colorScheme="blue"
          />
        </TabsContent>

        <TabsContent value="blocks">
          <AnalyticsChart title="Block Production" data={blockData} type="bar" height={300} colorScheme="green" />
        </TabsContent>

        <TabsContent value="fees">
          <AnalyticsChart title="Fee Analysis" data={feeData} type="area" height={300} colorScheme="purple" />
        </TabsContent>
      </Tabs>

      {/* Cache Stats */}
      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cache Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <div className="font-medium">{cacheStats.size}</div>
                <div className="text-muted-foreground">Items Cached</div>
              </div>
              <div>
                <div className="font-medium">{cacheStats.hitRate.toFixed(1)}%</div>
                <div className="text-muted-foreground">Hit Rate</div>
              </div>
              <div>
                <div className="font-medium">{cacheStats.memoryUsage.toFixed(1)}KB</div>
                <div className="text-muted-foreground">Memory Usage</div>
              </div>
              <div>
                <div className="font-medium">{cacheStats.evictions}</div>
                <div className="text-muted-foreground">Evictions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AnalyticsDashboard;
