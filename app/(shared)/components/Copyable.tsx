'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/app/(shared)/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(shared)/components/ui/tooltip';

interface CopyableProps {
  text: string;
  replaceText?: boolean;
  children?: React.ReactNode;
  className?: string;
  toastMessage?: string;
  iconSize?: number;
}

export function Copyable({
  text,
  replaceText = false,
  children,
  className,
  toastMessage = 'Copied to clipboard',
  iconSize = 14,
}: CopyableProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(toastMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy text');
    }
  };

  if (children) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              onClick={handleCopy}
              className={`cursor-pointer ${className || ''}`}
              style={{ position: 'relative' }}
            >
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? 'Copied!' : 'Click to copy'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Click to copy'}
          >
            {copied ? (
              <Check style={{ width: iconSize, height: iconSize }} className="text-green-500" />
            ) : (
              <Copy style={{ width: iconSize, height: iconSize }} />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? 'Copied!' : replaceText ? 'Click to copy' : 'Copy'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
