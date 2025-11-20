import React from 'react';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';

export function LoadingCard({ message }: { message?: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <span
          className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-top"
          role="status"
          aria-label="Loading"
        />
        <span className="text-foreground">{message || 'Loading'}</span>
      </CardContent>
    </Card>
  );
}
