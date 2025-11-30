'use client';

import { ErrorCard } from '@/app/(shared)/components';

interface StatsNotReadyProps {
  error?: boolean;
}

export default function StatsNotReady({ error = false }: StatsNotReadyProps) {
  return (
    <ErrorCard
      text={error ? 'Stats service unavailable' : 'Loading stats data...'}
      retry={error ? undefined : () => window.location.reload()}
    />
  );
}
