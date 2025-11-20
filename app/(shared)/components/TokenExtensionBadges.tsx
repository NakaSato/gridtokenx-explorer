import { ComponentProps } from 'react';

import { ParsedTokenExtension } from '@/app/(features)/accounts/components/types';
import { cn } from '@/app/(shared)/utils';

import { TokenExtensionBadge } from './TokenExtensionBadge';

export function TokenExtensionBadges({
  className,
  extensions,
  onClick,
}: {
  className?: string;
  extensions: ParsedTokenExtension[];
  onClick?: ComponentProps<typeof TokenExtensionBadge>['onClick'];
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {extensions.map((extension, i) => (
        <TokenExtensionBadge
          key={`token-extension-${extension.extension}-${i}`}
          extension={extension}
          label={extension.extension}
          onClick={onClick}
        />
      ))}
    </div>
  );
}
