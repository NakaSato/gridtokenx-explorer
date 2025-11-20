import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { cn } from '@/app/(shared)/utils';
import React from 'react';

/**
 * ChartCard - Reusable wrapper component for Nivo charts with consistent styling
 *
 * @param title - Chart title displayed in the header
 * @param description - Optional description text below the title
 * @param children - Chart component (usually a Nivo ResponsiveXxx component)
 * @param height - Height class for the chart container (default: 'h-[300px]')
 * @param className - Additional CSS classes for the Card wrapper
 *
 * @example
 * ```tsx
 * import { ResponsiveLine } from '@nivo/line';
 * import { ChartCard } from '@/app/(shared)/components/shared/ChartCard';
 * import { useNivoTheme } from '@/app/(shared)/components/shared/useNivoTheme';
 *
 * function TransactionChart() {
 *   const nivoTheme = useNivoTheme();
 *
 *   return (
 *     <ChartCard
 *       title="Transaction Volume"
 *       description="Daily transaction count"
 *       height="h-[400px]"
 *     >
 *       <ResponsiveLine
 *         data={data}
 *         theme={nivoTheme}
 *         // ... other props
 *       />
 *     </ChartCard>
 *   );
 * }
 * ```
 */
interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  height?: string;
  className?: string;
}

export function ChartCard({ title, description, children, height = 'h-[300px]', className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className={cn(height, 'w-full')}>{children}</div>
      </CardContent>
    </Card>
  );
}
