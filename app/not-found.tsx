import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function NotFoundPage() {
  return (
    <div className="container mx-auto -mt-12 px-4">
      <ErrorCard text="Page not found" />
    </div>
  );
}
