import React from 'react';

export function LoadingCard({ message }: { message?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="animate-pulse">
        <div className="mb-2 h-4 w-3/4 rounded bg-gray-300"></div>
        <div className="h-4 w-1/2 rounded bg-gray-300"></div>
      </div>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </div>
  );
}
