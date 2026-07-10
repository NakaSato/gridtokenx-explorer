'use client';

import { Button } from '@/app/(shared)/components/ui/button';
import { useCluster, useUpdateCustomUrl } from '@/app/(core)/providers/cluster';
import { useDebounceCallback } from '@/app/(shared)/hooks';
import { Cluster, clusterName, CLUSTERS, clusterSlug, ClusterStatus } from '@/app/(shared)/utils/cluster';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle, AlertCircle, Loader } from 'react-feather';

const ClusterModalDeveloperSettings = dynamic(() => import('./ClusterModalDeveloperSettings'), { ssr: false });

function getCustomUrlClusterName(customUrl: string) {
  try {
    const url = new URL(customUrl);
    if (url.hostname === 'localhost') {
      return customUrl;
    }
    return `${url.protocol}//${url.hostname}`;
  } catch (e) {
    return customUrl;
  }
}

export function ClusterDropdown() {
  const { status, cluster, name, customUrl } = useCluster();
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(customUrl);
  const [isNavigating, setIsNavigating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const updateCustomUrl = useUpdateCustomUrl();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusName = cluster !== Cluster.Custom ? `${name}` : getCustomUrlClusterName(customUrl);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard navigation: Escape closes, Arrow/Home/End move a roving focus
  // across the menu items so the list is fully keyboard-operable.
  useEffect(() => {
    function focusItem(index: number) {
      const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
      if (items.length === 0) return;
      const next = (index + items.length) % items.length;
      items[next]?.focus();
    }

    function currentIndex() {
      const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
      return items.findIndex(el => el === document.activeElement);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;
      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setShowCustomInput(false);
          buttonRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          focusItem(currentIndex() + 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusItem(currentIndex() - 1);
          break;
        case 'Home':
          event.preventDefault();
          focusItem(0);
          break;
        case 'End':
          event.preventDefault();
          focusItem(itemRefs.current.filter(Boolean).length - 1);
          break;
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  // Move focus onto the active option when the menu opens.
  useEffect(() => {
    if (!isOpen) return;
    const activeIdx = CLUSTERS.findIndex(net => net === cluster);
    itemRefs.current[activeIdx >= 0 ? activeIdx : 0]?.focus();
  }, [isOpen, cluster]);

  const onUrlInput = useDebounceCallback((url: string) => {
    updateCustomUrl(url);
    if (url.length > 0) {
      const nextSearchParams = new URLSearchParams(searchParams?.toString());
      nextSearchParams.set('customUrl', url);
      const nextQueryString = nextSearchParams.toString();
      router.push(`${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`);
    }
  }, 500);

  const handleClusterSelect = (selectedCluster: Cluster) => {
    // Custom keeps the menu open so the URL input can be shown; only real
    // clusters close it. (Previously the menu closed before this check, so
    // the custom input never appeared.)
    if (selectedCluster === Cluster.Custom) {
      setShowCustomInput(true);
      return;
    }

    setIsOpen(false);

    const nextSearchParams = new URLSearchParams(searchParams?.toString());
    const slug = clusterSlug(selectedCluster);

    // Save to localStorage
    try {
      localStorage.setItem('explorer-last-cluster', slug);
    } catch (e) {
      // Ignore localStorage errors
    }

    if (slug !== 'mainnet-beta') {
      nextSearchParams.set('cluster', slug);
    } else {
      nextSearchParams.delete('cluster');
    }
    const nextQueryString = nextSearchParams.toString();
    const clusterUrl = `${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`;

    setIsNavigating(true);
    router.push(clusterUrl);
  };

  const getStatusIcon = () => {
    if (isNavigating) {
      return <Loader size={14} className="text-current opacity-70" aria-hidden="true" />;
    }
    switch (status) {
      case ClusterStatus.Connected:
        return <CheckCircle size={14} className="text-emerald-500" aria-hidden="true" />;
      case ClusterStatus.Connecting:
        return <Loader size={14} className="text-yellow-500" aria-hidden="true" />;
      case ClusterStatus.Failure:
        return <AlertCircle size={14} className="text-destructive" aria-hidden="true" />;
    }
  };

  const getStatusButtonClass = () => {
    if (isNavigating) {
      return 'bg-muted border-border text-muted-foreground cursor-wait opacity-80';
    }
    switch (status) {
      case ClusterStatus.Connected:
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-accent hover:text-accent-foreground';
      case ClusterStatus.Connecting:
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500 hover:bg-accent hover:text-accent-foreground';
      case ClusterStatus.Failure:
        return 'bg-destructive/10 border-destructive/20 text-destructive hover:bg-accent hover:text-accent-foreground';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case ClusterStatus.Connected:
        return 'Connected';
      case ClusterStatus.Connecting:
        return 'Connecting';
      case ClusterStatus.Failure:
        return 'Connection failed';
    }
  };

  // Reset navigation state when status changes (connection attempt finished)
  useEffect(() => {
    if (status === ClusterStatus.Connected || status === ClusterStatus.Failure) {
      setIsNavigating(false);
    }
  }, [status]);

  // Reset the per-item ref list on every render so stale rows don't linger.
  itemRefs.current = [];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex min-w-[140px] items-center justify-between gap-2 transition-all duration-200 hover:scale-105 active:scale-95 sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] ${getStatusButtonClass()}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Cluster selector: ${statusName}, ${getStatusLabel()}`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {getStatusIcon()}
          <span className="truncate text-xs sm:text-sm">{statusName}</span>
        </div>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 z-50 mt-2 w-72 animate-in fade-in slide-in-from-top-2 rounded-lg border border-border bg-popover shadow-xl duration-200 sm:w-80 md:w-96"
          role="menu"
          aria-label="Cluster selection menu"
        >
          <div className="p-3 sm:p-4">
            <h3 className="mb-3 text-sm font-semibold text-popover-foreground">Choose a Cluster</h3>

            {/* Cluster Options */}
            <div className="space-y-2">
              {CLUSTERS.map((net, index) => {
                const active = net === cluster;

                if (net === Cluster.Custom) {
                  return (
                    <div key={index} className="space-y-2">
                      <Button
                        ref={el => {
                          itemRefs.current[index] = el;
                        }}
                        type="button"
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleClusterSelect(net)}
                        className={`h-10 w-full justify-start transition-all duration-200 hover:scale-[1.02] active:scale-98 sm:h-9 ${
                          active
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        }`}
                        role="menuitem"
                        aria-current={active ? 'true' : undefined}
                      >
                        <span className="text-xs sm:text-sm">Custom RPC URL</span>
                      </Button>

                      {showCustomInput && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <input
                            type="url"
                            value={customUrlInput}
                            onChange={e => setCustomUrlInput(e.target.value)}
                            onBlur={e => onUrlInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                onUrlInput(customUrlInput);
                                e.currentTarget.blur();
                              }
                            }}
                            placeholder="Enter custom RPC URL"
                            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm transition-all duration-200 placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none"
                            autoFocus
                            aria-label="Custom RPC URL input"
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Button
                    key={index}
                    ref={el => {
                      itemRefs.current[index] = el;
                    }}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleClusterSelect(net)}
                    className={`h-10 w-full justify-start transition-all duration-200 hover:scale-[1.02] active:scale-98 sm:h-9 ${
                      active
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                    role="menuitem"
                    aria-current={active ? 'true' : undefined}
                  >
                    <span className="text-xs sm:text-sm">{clusterName(net)}</span>
                  </Button>
                );
              })}
            </div>

            {/* Developer Settings */}
            <div className="mt-4 border-t border-border pt-4">
              <React.Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
                <ClusterModalDeveloperSettings />
              </React.Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
