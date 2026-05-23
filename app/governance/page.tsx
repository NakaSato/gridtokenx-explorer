import { Metadata } from 'next';
import GovernancePageClient from './page-client';

export const metadata: Metadata = {
  description: `Explore GridTokenX Governance Program activity`,
  title: `Governance Explorer | GridTokenX`,
};

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function GovernancePage() {
  return <GovernancePageClient />;
}
