import { Metadata } from 'next';
import TradingPageClient from './page-client';

export const metadata: Metadata = {
  description: `Explore GridTokenX Trading Program activity`,
  title: `Trading Explorer | GridTokenX`,
};

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function TradingPage() {
  return <TradingPageClient />;
}
