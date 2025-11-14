import { ErrorCard } from '@components/common/ErrorCard';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function NotFoundPage() {
    return (
        <div className="container mt-n3">
            <ErrorCard text="Page not found" />
        </div>
    );
}
