'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Address page error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-4 text-2xl font-bold">Failed to Load Address</h2>
        <p className="mb-8 text-gray-400">
          {error.message || 'An error occurred while loading this address.'}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-gray-600 px-6 py-3 font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
