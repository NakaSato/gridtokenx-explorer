import React from 'react';

import { cn } from './utils';

export function ErrorCard({ className, message }: React.HTMLAttributes<unknown> & { message?: string }) {
    return (
        <div className={cn('card', className)}>
            <div className="card-body p-1 text-center">{message || 'Error'}</div>
        </div>
    );
}
