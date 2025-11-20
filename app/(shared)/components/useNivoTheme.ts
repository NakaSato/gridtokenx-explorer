import { useTheme } from '@/app/(core)/providers/theme';

/**
 * Custom hook that returns a Nivo chart theme configuration that respects
 * the application's light/dark mode using semantic color tokens.
 *
 * Note: Requires @nivo/core to be installed:
 * ```bash
 * bun add @nivo/core @nivo/line @nivo/bar @nivo/pie
 * ```
 *
 * @returns Theme object compatible with all Nivo charts
 *
 * @example
 * ```tsx
 * import { ResponsiveLine } from '@nivo/line';
 * import { useNivoTheme } from '@/app/(shared)/components/shared/useNivoTheme';
 *
 * function MyChart() {
 *   const nivoTheme = useNivoTheme();
 *
 *   return (
 *     <ResponsiveLine
 *       data={data}
 *       theme={nivoTheme}
 *       // ... other props
 *     />
 *   );
 * }
 * ```
 */
export function useNivoTheme() {
  const { resolvedTheme } = useTheme();

  return {
    text: {
      fill: 'hsl(var(--foreground))',
      fontSize: 11,
    },
    grid: {
      line: {
        stroke: 'hsl(var(--border))',
        strokeWidth: 1,
      },
    },
    axis: {
      domain: {
        line: {
          stroke: 'hsl(var(--border))',
          strokeWidth: 1,
        },
      },
      ticks: {
        line: {
          stroke: 'hsl(var(--border))',
          strokeWidth: 1,
        },
        text: {
          fill: 'hsl(var(--muted-foreground))',
        },
      },
      legend: {
        text: {
          fill: 'hsl(var(--foreground))',
          fontSize: 12,
        },
      },
    },
    tooltip: {
      container: {
        background: 'hsl(var(--popover))',
        color: 'hsl(var(--popover-foreground))',
        fontSize: 12,
        borderRadius: '6px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
        padding: '5px 9px',
      },
    },
    legends: {
      text: {
        fill: 'hsl(var(--foreground))',
      },
    },
  };
}
