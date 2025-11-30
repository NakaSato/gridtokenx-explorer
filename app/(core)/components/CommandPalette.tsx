'use client';

import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/app/(shared)/components/ui/command';
import { useClusterPath } from '@/app/(shared)/utils/url';
import { Search } from 'react-feather';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const transactionsPath = useClusterPath({ pathname: '/txs' });
  const supplyPath = useClusterPath({ pathname: '/supply' });
  const inspectorPath = useClusterPath({ pathname: '/tx/inspector' });
  const featureGatesPath = useClusterPath({ pathname: '/feature-gates' });
  const anchorPublicKeysPath = useClusterPath({ pathname: '/anchor-public-keys' });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleNavigate = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden w-full items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground lg:flex"
        aria-label="Open command palette"
      >
        <Search size={16} />
        <span>Quick search...</span>
        <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => handleNavigate('/')}>
              <span>Home</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate(transactionsPath)}>
              <span>Transactions</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate(anchorPublicKeysPath)}>
              <span>Anchor Public Keys</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate(featureGatesPath)}>
              <span>Feature Gates</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate(supplyPath)}>
              <span>Supply</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigate(inspectorPath)}>
              <span>Transaction Inspector</span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => {
              window.location.href = 'https://solana.com/docs';
              setOpen(false);
            }}>
              <span>Documentation</span>
            </CommandItem>
            <CommandItem onSelect={() => {
              window.location.href = 'https://github.com/solana-labs/solana';
              setOpen(false);
            }}>
              <span>GitHub</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
