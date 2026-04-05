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
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-4 text-3xl font-bold">Something went wrong!</h2>
        <p className="mb-8 text-muted-foreground">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={reset} size="lg">
            Try again
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-8 text-sm text-muted-foreground">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
