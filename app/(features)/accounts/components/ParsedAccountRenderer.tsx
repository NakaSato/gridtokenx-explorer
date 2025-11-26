import { ErrorCard } from '@/app/(shared)/components/ErrorCard';
import { LoadingCard } from '@/app/(shared)/components/LoadingCard';
import { Account, useAccountInfo, useFetchAccountInfo } from '@/app/(core)/providers/accounts';
import { FetchStatus } from '@/app/(core)/providers/cache';
import { useCluster } from '@/app/(core)/providers/cluster';
import { toAddress, addressToPublicKey } from '@/app/(shared)/utils/rpc';
import { PublicKey } from '@solana/web3.js';
import { ClusterStatus } from '@/app/(shared)/utils/cluster';
import { redirect } from 'next/navigation';
import React, { useCallback, useEffect, useMemo } from 'react';

import { useClusterPath } from '@/app/(shared)/utils/url';

type ParsedAccountRendererProps = Readonly<{
  account: Account | undefined;
  onNotFound(): never;
}>;

export function ParsedAccountRenderer({
  address,
  renderComponent: RenderComponent,
}: {
  address: string;
  renderComponent: React.ComponentType<ParsedAccountRendererProps>;
}) {
  const fetchAccount = useFetchAccountInfo();
  const { status } = useCluster();
  const accountInfoCacheEntry = useAccountInfo(address);
  const pubkey = useMemo(() => addressToPublicKey(toAddress(address)), [address]);
  const rootAddressPathname = useClusterPath({ pathname: `/address/${address}` });
  const onNotFound = useCallback(() => {
    redirect(rootAddressPathname);
  }, [rootAddressPathname]);
  useEffect(() => {
    if (!accountInfoCacheEntry && status === ClusterStatus.Connected && address) {
      // Fetch account on load
      fetchAccount(pubkey, 'parsed');
    }
  }, [accountInfoCacheEntry, address, fetchAccount, pubkey, status]);
  if (!accountInfoCacheEntry || accountInfoCacheEntry.status === FetchStatus.Fetching) {
    return <LoadingCard />;
  } else if (
    accountInfoCacheEntry.status === FetchStatus.FetchFailed ||
    accountInfoCacheEntry.data?.lamports === undefined
  ) {
    return <ErrorCard retry={() => fetchAccount(pubkey, 'parsed')} text="Fetch Failed" />;
  } else {
    return <RenderComponent account={accountInfoCacheEntry.data} onNotFound={onNotFound} />;
  }
}
