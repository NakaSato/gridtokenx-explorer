// Advanced data visualization components for blockchain analytics
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

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
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = React.useState<ChartData | null>(null);

  const getColorPalette = (scheme: string) => {
    const palettes = {
      blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
      green: ['#10b981', '#34d399', '#6ee7b7', '#d1fae5'],
      purple: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ede9fe'],
      orange: ['#f97316', '#fb923c', '#fdba74', '#fed7aa'],
      red: ['#ef4444', '#f87171', '#fca5a5', '#fecaca'],
    };
    return palettes[scheme as keyof typeof palettes] || palettes.blue;
  };

  const colors = getColorPalette(colorScheme);

  const renderChart = () => {
    if (!data || data.length === 0) {
      return <div className="text-muted-foreground flex h-full items-center justify-center">No data available</div>;
    }

    switch (type) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'area':
        return renderAreaChart();
      default:
        return renderLineChart();
    }
  };

  const renderLineChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
      <svg width="100%" height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => (
          <line key={percent} x1="0" y1={`${percent}%`} x2="100%" y2={`${percent}%`} stroke="#e5e7eb" strokeWidth="1" />
        ))}

        {/* Data line */}
        <polyline
          points={data
            .map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((point.value - minValue) / range) * 100;
              return `${x},${y}`;
            })
            .join(' ')}
          fill="none"
          stroke={colors[0]}
          strokeWidth="2"
          className="transition-all duration-200"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((point.value - minValue) / range) * 100;

          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="4"
              fill={colors[0]}
              className="hover:r-6 cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        })}
      </svg>
    );
  };

  const renderBarChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = Math.min(100 / data.length - 2, 80);

    return (
      <svg width="100%" height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => (
          <line key={percent} x1="0" y1={`${percent}%`} x2="100%" y2={`${percent}%`} stroke="#e5e7eb" strokeWidth="1" />
        ))}

        {/* Bars */}
        {data.map((point, index) => {
          const x = (index / data.length) * 100 + (100 / data.length - barWidth) / 2;
          const height = (point.value / maxValue) * 80;
          const y = 100 - height;

          return (
            <rect
              key={index}
              x={`${x}%`}
              y={`${y}%`}
              width={`${barWidth}%`}
              height={`${height}%`}
              fill={colors[index % colors.length]}
              className="cursor-pointer transition-all duration-200 hover:opacity-80"
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        })}
      </svg>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;

    const segments = data.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      currentAngle = endAngle;

      return {
        ...item,
        percentage,
        startAngle,
        endAngle,
        color: colors[index % colors.length],
      };
    });

    const createPiePath = (segment: (typeof segments)[0]) => {
      const radius = 40;
      const centerX = 50;
      const centerY = 50;

      const x1 = centerX + radius * Math.cos((segment.startAngle * Math.PI) / 180);
      const y1 = centerY + radius * Math.sin((segment.startAngle * Math.PI) / 180);
      const x2 = centerX + radius * Math.cos((segment.endAngle * Math.PI) / 180);
      const y2 = centerY + radius * Math.sin((segment.endAngle * Math.PI) / 180);

      const largeArc = segment.angle > 180 ? 1 : 0;

      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    return (
      <svg width="100%" height={height} viewBox="0 0 100 100">
        {segments.map((segment, index) => (
          <g key={index}>
            <path
              d={createPiePath(segment)}
              fill={segment.color}
              className="cursor-pointer transition-all duration-200 hover:opacity-80"
              onMouseEnter={() => setHoveredPoint(segment)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
            {segment.percentage > 5 && (
              <text
                x={50 + 25 * Math.cos(((segment.startAngle + segment.angle / 2) * Math.PI) / 180)}
                y={50 + 25 * Math.sin(((segment.startAngle + segment.angle / 2) * Math.PI) / 180)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-xs font-medium"
              >
                {segment.percentage.toFixed(1)}%
              </text>
            )}
          </g>
        ))}
      </svg>
    );
  };

  const renderAreaChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    const areaPath = data
      .map((point, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((point.value - minValue) / range) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg width="100%" height={height} className="overflow-visible">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(percent => (
          <line key={percent} x1="0" y1={`${percent}%`} x2="100%" y2={`${percent}%`} stroke="#e5e7eb" strokeWidth="1" />
        ))}

        {/* Area */}
        <path
          d={`M 0,100 L ${areaPath} L 100,100 Z`}
          fill={colors[0]}
          fillOpacity="0.2"
          className="transition-all duration-200"
        />

        {/* Line */}
        <polyline
          points={areaPath}
          fill="none"
          stroke={colors[0]}
          strokeWidth="2"
          className="transition-all duration-200"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((point.value - minValue) / range) * 100;

          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={`${y}%`}
              r="4"
              fill={colors[0]}
              className="hover:r-6 cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          );
        })}
      </svg>
    );
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
        <div className="relative" ref={chartRef}>
          {renderChart()}

          {/* Tooltip */}
          {showTooltip && hoveredPoint && (
            <div className="absolute top-2 right-2 z-10 rounded bg-black px-2 py-1 text-xs text-white shadow-lg">
              <div className="font-medium">{hoveredPoint.label}</div>
              <div>{formatValue(hoveredPoint.value)}</div>
              {hoveredPoint.timestamp && <div className="text-gray-300">{hoveredPoint.timestamp.toLocaleString()}</div>}
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && type !== 'pie' && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className={`h-3 w-3 rounded`} style={{ backgroundColor: colors[0] }} />
              <span>{title}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
