import { cva, type VariantProps } from 'class-variance-authority';
import { useCallback } from 'react';

import { ParsedTokenExtension } from '@/app/(features)/accounts/components/types';
import { StatusBadge } from '@/app/(shared)/components/StatusBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/(shared)/components/ui/tooltip';

const badgeVariants = cva('', {
  defaultVariants: {
    size: 'sm',
  },
  variants: {
    size: {
      sm: 'text-14',
    },
  },
});

export function TokenExtensionBadge({
  extension,
  label,
  onClick,
  size,
}: {
  extension: ParsedTokenExtension;
  label?: string;
  onClick?: ({ extensionName }: { extensionName: ParsedTokenExtension['extension'] }) => void;
} & VariantProps<typeof badgeVariants>) {
  const { extension: extensionName, status, tooltip } = extension;

  const handleClick = useCallback(() => {
    onClick?.({ extensionName });
  }, [extensionName, onClick]);

  return (
    <Tooltip>
      <TooltipTrigger className="border-0 bg-transparent p-0" onClick={handleClick}>
        <StatusBadge status={status} label={label} className={badgeVariants({ size })} />
      </TooltipTrigger>
      {tooltip && (
        <TooltipContent>
          <div className="max-w-16 min-w-36">{tooltip}</div>
        </TooltipContent>
      )}
    </Tooltip>
  );
}
