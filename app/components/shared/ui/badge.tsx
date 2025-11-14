import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variancauthority';
import * as React from 'react';

import { cn } from '@/app/components/shared/utils';

const badgeVariants = cva(
    'inlinflex items-center justify-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outlinnone focus:ring-2 focus:ring-ring focus:ring-offset-2 w-fit whitespacnowrap shrink-0',
    {
        defaultVariants: {
            variant: 'default',
        },
        variants: {
            variant: {
                default:
                    'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
                secondary:
                    'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive:
                    'border-transparent bg-destructive text-destructivforeground hover:bg-destructive/80',
                outline: 'text-foreground',
            },
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {
    asChild?: boolean;
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
    const Comp = asChild ? Slot : 'div';
    return <Comp className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
