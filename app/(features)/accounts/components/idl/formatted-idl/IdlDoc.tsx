'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/(shared)/components/ui/tooltip';

export function IdlDoc({ docs }: { docs: string[] }) {
  if (!docs?.length) return null;

  return <p className="text-muted-foreground mb-0">{docs.join(' ')}</p>;
}

export function IdlDocTooltip({ docs, children }: { docs?: string[]; children: React.ReactNode }) {
  if (!docs?.length) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        {/* asChild renders the trigger into the child markup instead of an
            extra <button>, which produced invalid nested buttons. */}
        <TooltipTrigger asChild>
          <span tabIndex={0} className="cursor-help">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-16 min-w-36">{docs.join(' ')}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
