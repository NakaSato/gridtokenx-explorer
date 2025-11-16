export function FeatureGateCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex items-center border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Feature Information</h3>
      </div>
      <div className="border-t px-6 py-4">
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
