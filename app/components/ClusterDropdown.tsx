'use client';

import { Button } from '@components/shared/ui/button';
import { useCluster, useUpdateCustomUrl } from '@providers/cluster';
import { useDebounceCallback } from '@react-hook/debounce';
import { Cluster, clusterName, CLUSTERS, clusterSlug, ClusterStatus } from '@utils/cluster';
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
  const dropdownRef = useRef<HTMLDivElement>(null);
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
    setIsOpen(false);

    if (selectedCluster === Cluster.Custom) {
      setShowCustomInput(true);
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams?.toString());
    const slug = clusterSlug(selectedCluster);
    if (slug !== 'mainnet-beta') {
      nextSearchParams.set('cluster', slug);
    } else {
      nextSearchParams.delete('cluster');
    }
    const nextQueryString = nextSearchParams.toString();
    const clusterUrl = `${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`;
    router.push(clusterUrl);
  };

  const getStatusIcon = () => {
    switch (status) {
      case ClusterStatus.Connected:
        return <CheckCircle size={14} className="text-green-500" />;
      case ClusterStatus.Connecting:
        return <Loader size={14} className="animate-spin text-yellow-500" />;
      case ClusterStatus.Failure:
        return <AlertCircle size={14} className="text-red-500" />;
    }
  };

  const getStatusButtonClass = () => {
    switch (status) {
      case ClusterStatus.Connected:
        return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
      case ClusterStatus.Connecting:
        return 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100';
      case ClusterStatus.Failure:
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex min-w-[140px] sm:min-w-[160px] md:min-w-[180px] lg:min-w-[200px] items-center justify-between gap-2 ${getStatusButtonClass()}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getStatusIcon()}
          <span className="truncate text-xs sm:text-sm">{statusName}</span>
        </div>
        <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 w-72 sm:w-80 md:w-96 rounded-md border border-gray-200 shadow-lg">
          <div className="p-3 sm:p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Choose a Cluster</h3>

            {/* Cluster Options */}
            <div className="space-y-2">
              {CLUSTERS.map((net, index) => {
                const active = net === cluster;

                if (net === Cluster.Custom) {
                  return (
                    <div key={index} className="space-y-2">
                      <Button
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleClusterSelect(net)}
                        className={`w-full justify-start h-10 sm:h-9 ${active ? 'bg-blue-500 text-white' : ''}`}
                      >
                        <span className="text-xs sm:text-sm">Custom RPC URL</span>
                      </Button>

                      {showCustomInput && (
                        <div className="mt-2">
                          <input
                            type="url"
                            value={customUrlInput}
                            onChange={e => setCustomUrlInput(e.target.value)}
                            onBlur={e => onUrlInput(e.target.value)}
                            placeholder="Enter custom RPC URL"
                            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Button
                    key={index}
                    variant={active ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleClusterSelect(net)}
                    className={`w-full justify-start h-10 sm:h-9 ${active ? 'bg-blue-500 text-white' : ''}`}
                  >
                    <span className="text-xs sm:text-sm">{clusterName(net)}</span>
                  </Button>
                );
              })}
            </div>

            {/* Developer Settings */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              <React.Suspense fallback={<div className="text-sm text-gray-500">Loading...</div>}>
                <ClusterModalDeveloperSettings />
              </React.Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
