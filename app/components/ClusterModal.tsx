'use client';

import { useCluster, useClusterModal, useUpdateCustomUrl } from '@providers/cluster';
import { useDebounceCallback } from '@react-hook/debounce';
import { Cluster, clusterName, CLUSTERS, clusterSlug, ClusterStatus } from '@utils/cluster';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React from 'react';

import { Overlay } from './common/Overlay';

const ClusterModalDeveloperSettings = dynamic(() => import('./ClusterModalDeveloperSettings'), { ssr: false });

export function ClusterModal() {
  const [show, setShow] = useClusterModal();
  const onClose = () => setShow(false);

  return (
    <>
      <div
        className={`fixed inset-y-0 right-0 w-80 transform bg-white shadow-lg transition-transform duration-300 ease-in-out ${show ? 'translate-x-0' : 'translate-x-full'} z-50`}
      >
        <div className="h-full overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
          <span className="cursor-pointer text-2xl text-gray-500 hover:text-gray-700" onClick={onClose}>
            ×
          </span>

          <h2 className="mt-4 mb-4 text-center text-lg font-semibold">Choose a Cluster</h2>
          <ClusterToggle />
          <ClusterModalDeveloperSettings />
        </div>
      </div>

      <div onClick={onClose}>
        <Overlay show={show} />
      </div>
    </>
  );
}

type InputProps = { activeSuffix: string; active: boolean };
function CustomClusterInput({ activeSuffix, active }: InputProps) {
  const { customUrl } = useCluster();
  const updateCustomUrl = useUpdateCustomUrl();
  const [editing, setEditing] = React.useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const btnClass = active
    ? `border-blue-500 text-blue-500 bg-blue-50`
    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50';

  const onUrlInput = useDebounceCallback((url: string) => {
    updateCustomUrl(url);
    if (url.length > 0) {
      const nextSearchParams = new URLSearchParams(searchParams?.toString());
      nextSearchParams.set('customUrl', url);
      const nextQueryString = nextSearchParams.toString();
      router.push(`${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`);
    }
  }, 500);

  const inputTextClass = editing ? '' : 'text-gray-500';
  return (
    <>
      <Link
        className={`mb-3 w-full rounded-md border px-4 py-2 ${btnClass} block text-center transition-colors duration-200`}
        href={{ query: { cluster: 'custom', ...(customUrl.length > 0 ? { customUrl } : null) } }}
      >
        Custom RPC URL
      </Link>
      {active && (
        <input
          type="url"
          defaultValue={customUrl}
          className={`w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none ${inputTextClass}`}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          onInput={e => onUrlInput(e.currentTarget.value)}
        />
      )}
    </>
  );
}

function assertUnreachable(_x: never): never {
  throw new Error('Unreachable!');
}

function ClusterToggle() {
  const { status, cluster } = useCluster();

  let activeColor = '';
  let activeBg = '';
  switch (status) {
    case ClusterStatus.Connected:
      activeColor = 'border-blue-500 text-blue-500 bg-blue-50';
      activeBg = 'bg-blue-50';
      break;
    case ClusterStatus.Connecting:
      activeColor = 'border-yellow-500 text-yellow-500 bg-yellow-50';
      activeBg = 'bg-yellow-50';
      break;
    case ClusterStatus.Failure:
      activeColor = 'border-red-500 text-red-500 bg-red-50';
      activeBg = 'bg-red-50';
      break;
    default:
      assertUnreachable(status);
  }
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {CLUSTERS.map((net, index) => {
        const active = net === cluster;
        if (net === Cluster.Custom)
          return <CustomClusterInput key={index} activeSuffix={activeColor} active={active} />;

        const btnClass = active ? activeColor : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50';

        const nextSearchParams = new URLSearchParams(searchParams?.toString());
        const slug = clusterSlug(net);
        if (slug !== 'mainnet-beta') {
          nextSearchParams.set('cluster', slug);
        } else {
          nextSearchParams.delete('cluster');
        }
        const nextQueryString = nextSearchParams.toString();
        const clusterUrl = `${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`;
        return (
          <Link
            key={index}
            className={`mb-2 w-full rounded-md border px-4 py-2 ${btnClass} block text-center transition-colors duration-200`}
            href={clusterUrl}
          >
            {clusterName(net)}
          </Link>
        );
      })}
    </div>
  );
}
