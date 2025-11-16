import React from 'react';

import { cn } from './utils';

export function LoadingCard({ className, message }: React.HTMLAttributes<unknown> & { message?: string }) {
    return (
        <div className={cn('card', className)}>
            <div className="card-body p-1 text-center">
                <span className="spinner-grow spinner-grow-sm m2 align-text-top"></span>
                {message || 'Loading'}
            </div>
        </div>
    );
}
