'use client';

import { useEffect } from 'react';
import { Button } from '@/app/(shared)/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Block page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-4 text-2xl font-bold">Failed to Load Block</h2>
        <p className="mb-8 text-muted-foreground">
          {error.message || 'An error occurred while loading this block.'}
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
