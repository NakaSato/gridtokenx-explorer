import { cva, VariantProps } from 'class-variance-authority';
import React from 'react';

const tableVariants = cva(['w-full'], {
    defaultVariants: {
        layout: 'compact',
    },
    variants: {
        layout: {
            compact: ['whitespace-nowrap'],
            expanded: ['whitespace-normal'],
        },
    },
});

export interface TableCardBodyProps extends VariantProps<typeof tableVariants>, React.PropsWithChildren {}

export function TableCardBody({ children, ...props }: TableCardBodyProps) {
    return (
        <div className="overflow-x-auto mb-0">
            <table className={tableVariants(props)}>
                <tbody className="divide-y divide-gray-200">{children}</tbody>
            </table>
        </div>
    );
}

export interface TableCardBodyHeadedProps extends VariantProps<typeof tableVariants>, React.PropsWithChildren {
    headerComponent?: React.ReactNode;
}

export function TableCardBodyHeaded({ children, headerComponent, ...props }: TableCardBodyHeadedProps) {
    return (
        <div className="overflow-x-auto mb-0">
            <table className={tableVariants(props)}>
                {headerComponent ? <thead>{headerComponent}</thead> : null}
                <tbody className="divide-y divide-gray-200">{children}</tbody>
            </table>
        </div>
    );
}
