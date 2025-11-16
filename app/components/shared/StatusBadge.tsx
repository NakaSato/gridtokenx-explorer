import { cva } from 'class-variance-authority';
import * as React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'react-feather';

import { Badge } from '@/app/components/shared/ui/badge';
import { cn } from '@/app/components/shared/utils';

export type StatusType = 'active' | 'inactive' | 'success' | 'error' | 'warning' | 'info';

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
}

const statusBadgeVariants = cva('', {
  defaultVariants: {
    status: 'active',
  },
  variants: {
    status: {
      active:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
      success:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      warning:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
  },
});

export function StatusBadge({ status, showIcon = true, className, label, ...props }: StatusBadgeProps) {
  return (
    <Badge className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {showIcon && <span className="mr-1">{getStatusIcon(status)}</span>}
      <span>{label ?? getStatusLabel(status)}</span>
    </Badge>
  );
}

function getStatusIcon(status: StatusType): React.ReactElement | null {
  const iconSize = 12;
  switch (status) {
    case 'success':
    case 'active':
      return <CheckCircle size={iconSize} />;
    case 'error':
      return <XCircle size={iconSize} />;
    case 'warning':
      return <AlertCircle size={iconSize} />;
    case 'info':
    case 'inactive':
      return <Info size={iconSize} />;
    default:
      return null;
  }
}

export function getStatusLabel(status: StatusType): string {
  switch (status) {
    case 'inactive':
      return 'Disabled';
    case 'active':
      return 'Enabled';
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Info';
    default:
      return status;
  }
}
