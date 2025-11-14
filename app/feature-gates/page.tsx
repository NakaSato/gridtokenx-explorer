import FeatureGatesPageClient from './page-client';

export const metadata = {
    description: `Overview of the feature gates on Solana`,
    title: `Feature Gates | Solana`,
};

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function FeatureGatesPage() {
    return <FeatureGatesPageClient />;
}
