// Advanced data visualization components for blockchain analytics
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface ChartData {
  label: string;
  value: number;
  timestamp?: Date;
  color?: string;
}

export interface AnalyticsChartProps {
  title: string;
  data: ChartData[];
  type?: 'line' | 'bar' | 'pie' | 'area';
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export function AnalyticsChart({
  title,
  data,
  type = 'line',
  height = 300,
  showLegend = true,
  showTooltip = true,
  formatValue = v => v.toString(),
  colorScheme = 'blue',
}: AnalyticsChartProps) {
  const getColorPalette = (scheme: string) => {
    // Map schemes to CSS variables defined in globals.css
    const palettes = {
      blue: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'],
      green: ['var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'],
      purple: ['var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-1)'],
      orange: ['var(--chart-4)', 'var(--chart-5)', 'var(--chart-1)', 'var(--chart-2)'],
      red: ['var(--destructive)', 'var(--destructive)', 'var(--destructive)', 'var(--destructive)'],
      // Default fallback using primary/secondary
      default: ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--muted)'],
    };
    return palettes[scheme as keyof typeof palettes] || palettes.default;
  };

  const colors = getColorPalette(colorScheme);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="rounded bg-black px-2 py-1 text-xs text-white shadow-lg border border-border">
          <div className="font-medium">{label}</div>
          <div>{formatValue(payload[0].value)}</div>
          {dataPoint.timestamp && <div className="text-gray-300">{dataPoint.timestamp.toLocaleString()}</div>}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!data || data.length === 0) {
      return <div className="text-muted-foreground flex h-full items-center justify-center">No data available</div>;
    }

    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={formatValue}
              />
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ r: 4, fill: colors[0] }}
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={formatValue}
              />
              {showTooltip && <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />}
              {showLegend && <Legend />}
              <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} animationDuration={1000}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`colorValue-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={formatValue}
              />
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && <Legend />}
              <Area
                type="monotone"
                dataKey="value"
                stroke={colors[0]}
                fillOpacity={1}
                fill={`url(#colorValue-${title})`}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant="outline" className="text-xs">
            {type.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: height, width: '100%' }}>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}
