import { LoadingArtPlaceholder } from '@/app/(shared)/components/LoadingArtPlaceholder';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-700" />
      </div>
      <LoadingArtPlaceholder />
    </div>
  );
}
