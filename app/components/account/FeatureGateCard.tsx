export function FeatureGateCard({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-card border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b flex items-center">
                <h3 className="text-lg font-semibold">Feature Information</h3>
            </div>
            <div className="px-6 py-4 border-t">
                <div className="text-muted-foreground">{children}</div>
            </div>
        </div>
    );
}
