import { Metadata } from 'next/types';

// Import components dynamically to prevent build-time execution
const TransactionInspectorPage = (() => {
  if (typeof window === 'undefined') {
    return () => null;
  }
  return require('@/app/(features)/transactions/components').TransactionInspectorPage;
})();

type Props = Readonly<{
  params: Readonly<{
    signature: string;
  }>;
}>;

export async function generateMetadata({ params: { signature } }: Props): Promise<Metadata> {
  // Always use a safe placeholder during build time - signature validation is client-side only
  const safeSignature = signature || 'Transaction';
  return {
    description: `Interactively inspect transaction with signature ${safeSignature} on Solana`,
    title: `Transaction Inspector | ${safeSignature} | Solana`,
  };
}

export default function TransactionInspectionPage({ params: { signature } }: Props) {
  // Skip everything during build time - return a simple loading state
  if (typeof window === 'undefined') {
    return (
      <div className="container mt-4">
        <div className="header">
          <div className="header-body">
            <h2 className="header-title">Transaction Inspector</h2>
          </div>
        </div>
        <div>Loading transaction inspector...</div>
      </div>
    );
  }

  // Validate signature is a proper base58 string to prevent build-time errors
  const validSignature = signature && /^[1-9A-HJ-NP-Za-km-z]{32,88}$/.test(signature) ? signature : undefined;
  return <TransactionInspectorPage signature={validSignature} showTokenBalanceChanges={false} />;
}
