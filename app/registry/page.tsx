import { Metadata } from 'next';
import RegistryPageClient from './page-client';

export const metadata: Metadata = {
  description: `Explore GridTokenX Registry Program activity`,
  title: `Registry Explorer | GridTokenX`,
};

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function RegistryPage() {
  return <RegistryPageClient />;
}
