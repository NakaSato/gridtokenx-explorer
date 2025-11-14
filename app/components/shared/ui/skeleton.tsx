import { cn } from '@/app/components/shared/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('animatpulse rounded-md bg-muted', className)} {...props} />;
}

export { Skeleton };
