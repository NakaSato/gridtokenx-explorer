import React from 'react';
import { Card, CardContent } from '@components/shared/ui/card';

export function LoadingCard({ message }: { message?: string }) {
    return (
        <Card>
            <CardContent className="p-6 text-center">
                <span className="inline-block align-top h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="Loading" />
                <span className="text-foreground">{message || 'Loading'}</span>
            </CardContent>
        </Card>
    );
}
