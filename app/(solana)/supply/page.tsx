import { Metadata } from 'next';
import SupplyPageClient from './page-client';

export const metadata: Metadata = {
  description: `Overview of native token supply on Solana`,
  title: `Supply Overview | Solana`,
};

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function SupplyPage() {
  return <SupplyPageClient />;
}
