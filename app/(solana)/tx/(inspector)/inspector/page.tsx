// Import components dynamically to prevent build-time execution
const TransactionInspectorPage = (() => {
  if (typeof window === 'undefined') {
    return () => null;
  }
  return require('@/app/(features)/transactions/components').TransactionInspectorPage;
})();

// This page doesn't have a signature parameter - it's just the general inspector page
type Props = Readonly<{
  params: Readonly<{}>;
}>;

export default function Page(_params: Props) {
  // Skip everything during build time - return a simple loading state
  if (typeof window === 'undefined') {
    return (
      <div className="container mt-4">
        <div className="header">
          <div className="header-body">
            <h2 className="header-title">Transaction Inspector</h2>
          </div>
        </div>
        <div>Loading...</div>
      </div>
    );
  }

  // This is the general inspector page without a specific signature
  return <TransactionInspectorPage signature={undefined} showTokenBalanceChanges={true} />;
}
