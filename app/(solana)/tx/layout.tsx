import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Live Transactions | Solana Explorer',
  description: 'Real-time Solana blockchain transactions with live updates and analytics',
};

export default function TransactionsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
