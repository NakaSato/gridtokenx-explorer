import { Metadata } from 'next';
import OraclePageClient from './page-client';

export const metadata: Metadata = {
  description: `Explore GridTokenX Oracle Program activity`,
  title: `Oracle Explorer | GridTokenX`,
};

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function OraclePage() {
  return <OraclePageClient />;
}
