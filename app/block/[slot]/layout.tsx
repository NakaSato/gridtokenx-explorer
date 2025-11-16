'use client';

import { Address } from '@components/common/Address';
import { Epoch } from '@components/common/Epoch';
import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { Slot } from '@components/common/Slot';
import { TableCardBody } from '@components/common/TableCardBody';
import { BlockProvider, FetchStatus, useBlock, useFetchBlock } from '@providers/block';
import { useCluster } from '@providers/cluster';
import { ClusterStatus } from '@utils/cluster';
import { displayTimestamp, displayTimestampUtc } from '@utils/date';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import { notFound, useSelectedLayoutSegment } from 'next/navigation';
import React, { PropsWithChildren } from 'react';

import { estimateRequestedComputeUnits } from '@/app/utils/compute-units-schedule';
import { getEpochForSlot, getMaxComputeUnitsInBlock } from '@/app/utils/epoch-schedule';

type Props = PropsWithChildren<{ params: { slot: string } }>;

function BlockLayoutInner({ children, params: { slot } }: Props) {
  const slotNumber = Number(slot);
  if (isNaN(slotNumber) || slotNumber >= Number.MAX_SAFE_INTEGER || slotNumber % 1 !== 0) {
    notFound();
  }
  const confirmedBlock = useBlock(slotNumber);
  const fetchBlock = useFetchBlock();
  const { clusterInfo, status, cluster } = useCluster();
  const refresh = () => fetchBlock(slotNumber);

  // Fetch block on load
  React.useEffect(() => {
    if (!confirmedBlock && status === ClusterStatus.Connected) refresh();
  }, [slotNumber, status]); // eslint-disablline react-hooks/exhaustivdeps

  let content;
  if (!confirmedBlock || confirmedBlock.status === FetchStatus.Fetching) {
    content = <LoadingCard message="Loading block" />;
  } else if (confirmedBlock.data === undefined || confirmedBlock.status === FetchStatus.FetchFailed) {
    content = <ErrorCard retry={refresh} text="Failed to fetch block" />;
  } else if (confirmedBlock.data.block === undefined) {
    content = <ErrorCard retry={refresh} text={`Block ${slotNumber} was not found`} />;
  } else {
    const { block, blockLeader, childSlot, childLeader, parentLeader } = confirmedBlock.data;
    const epoch = clusterInfo ? getEpochForSlot(clusterInfo.epochSchedule, BigInt(slotNumber)) : undefined;

    let totalCUs = 0;
    let totalRequestedCUs = 0;
    let totalCostUnits = 0;
    for (const tx of block.transactions) {
      const requestedCUs = estimateRequestedComputeUnits(tx, epoch, cluster);
      const cus = tx.meta?.computeUnitsConsumed ?? 0;
      const costUnits = tx.meta?.costUnits ?? 0;
      totalRequestedCUs += requestedCUs;
      totalCUs += cus;
      totalCostUnits += costUnits;
    }

    const showSuccessfulCount = block.transactions.every(tx => tx.meta !== null);
    const successfulTxs = block.transactions.filter(tx => tx.meta?.err === null);
    const maxComputeUnits = getMaxComputeUnitsInBlock({ cluster, epoch });

    content = (
      <>
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="border-b px-6 py-4">
            <h3 className="mb-0 flex items-center text-lg font-semibold">Overview</h3>
          </div>
          <TableCardBody>
            <tr>
              <td className="w-full">Blockhash</td>
              <td className="font-mono lg:text-right">
                <span>{block.blockhash}</span>
              </td>
            </tr>
            <tr>
              <td className="w-full">Slot</td>
              <td className="font-mono lg:text-right">
                <Slot slot={slotNumber} />
              </td>
            </tr>
            {blockLeader !== undefined && (
              <tr>
                <td className="w-full">Slot Leader</td>
                <td className="lg:text-right">
                  <Address pubkey={blockLeader} alignRight link />
                </td>
              </tr>
            )}
            {block.blockTime ? (
              <>
                <tr>
                  <td>Timestamp (Local)</td>
                  <td className="lg:text-right">
                    <span className="font-mono">{displayTimestamp(block.blockTime * 1000, true)}</span>
                  </td>
                </tr>
                <tr>
                  <td>Timestamp (UTC)</td>
                  <td className="lg:text-right">
                    <span className="font-mono">{displayTimestampUtc(block.blockTime * 1000, true)}</span>
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td className="w-full">Timestamp</td>
                <td className="lg:text-right">Unavailable</td>
              </tr>
            )}
            {epoch !== undefined && (
              <tr>
                <td className="w-full">Epoch</td>
                <td className="font-mono lg:text-right">
                  <Epoch epoch={epoch} link />
                </td>
              </tr>
            )}
            <tr>
              <td className="w-full">Parent Blockhash</td>
              <td className="font-mono lg:text-right">
                <span>{block.previousBlockhash}</span>
              </td>
            </tr>
            <tr>
              <td className="w-full">Parent Slot</td>
              <td className="font-mono lg:text-right">
                <Slot slot={block.parentSlot} link />
              </td>
            </tr>
            {parentLeader !== undefined && (
              <tr>
                <td className="w-full">Parent Slot Leader</td>
                <td className="lg:text-right">
                  <Address pubkey={parentLeader} alignRight link />
                </td>
              </tr>
            )}
            {childSlot !== undefined && (
              <tr>
                <td className="w-full">Child Slot</td>
                <td className="font-mono lg:text-right">
                  <Slot slot={childSlot} link />
                </td>
              </tr>
            )}
            {childLeader !== undefined && (
              <tr>
                <td className="w-full">Child Slot Leader</td>
                <td className="lg:text-right">
                  <Address pubkey={childLeader} alignRight link />
                </td>
              </tr>
            )}
            <tr>
              <td className="w-full">Processed Transactions</td>
              <td className="font-mono lg:text-right">
                <span>{block.transactions.length}</span>
              </td>
            </tr>
            {showSuccessfulCount && (
              <tr>
                <td className="w-full">Successful Transactions</td>
                <td className="font-mono lg:text-right">
                  <span>{successfulTxs.length}</span>
                </td>
              </tr>
            )}
            <tr>
              <td className="w-full">Total Compute Units Consumed</td>
              <td className="font-mono lg:text-right">
                <span>{totalCUs.toLocaleString()}</span>
              </td>
            </tr>
            <tr>
              <td className="w-full">Transaction Cost Utilization</td>
              <td className="font-mono lg:text-right">
                <span>
                  {totalCostUnits.toLocaleString()} / {maxComputeUnits.toLocaleString()} (
                  {Math.round((totalCostUnits / maxComputeUnits) * 100)}%)
                </span>
              </td>
            </tr>
            <tr>
              <td className="w-full">Reserved Compute Units</td>
              <td className="font-mono lg:text-right">
                <span>
                  {totalRequestedCUs.toLocaleString()} / {maxComputeUnits.toLocaleString()} (
                  {Math.round((totalRequestedCUs / maxComputeUnits) * 100)}%)
                </span>
              </td>
            </tr>
          </TableCardBody>
        </div>
        <MoreSection slot={slotNumber}>{children}</MoreSection>
      </>
    );
  }
  return (
    <div className="container mx-auto -mt-12 px-4">
      <div className="header">
        <div className="header-body">
          <h6 className="header-pretitle">Details</h6>
          <h2 className="header-title">Block</h2>
        </div>
      </div>
      {content}
    </div>
  );
}

export default function BlockLayout({ children, params }: Props) {
  return (
    <BlockProvider>
      <BlockLayoutInner params={params}>{children}</BlockLayoutInner>
    </BlockProvider>
  );
}

const TABS: Tab[] = [
  {
    path: '',
    slug: 'history',
    title: 'Transactions',
  },
  {
    path: 'rewards',
    slug: 'rewards',
    title: 'Rewards',
  },
  {
    path: 'programs',
    slug: 'programs',
    title: 'Programs',
  },
  {
    path: 'accounts',
    slug: 'accounts',
    title: 'Accounts',
  },
];

type MoreTabs = 'history' | 'rewards' | 'programs' | 'accounts';

type Tab = {
  slug: MoreTabs;
  title: string;
  path: string;
};

function MoreSection({ children, slot }: { children: React.ReactNode; slot: number }) {
  return (
    <>
      <div className="container mx-auto px-4">
        <div className="header">
          <div className="header-body pt-0">
            <ul className="nav nav-tabs nav-overflow header-tabs">
              {TABS.map(({ title, slug, path }) => (
                <TabLink key={slug} slot={slot} path={path} title={title} />
              ))}
            </ul>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}

function TabLink({ path, slot, title }: { path: string; slot: number; title: string }) {
  const tabPath = useClusterPath({ pathname: `/block/${slot}/${path}` });
  const selectedLayoutSegment = useSelectedLayoutSegment();
  const isActive = (selectedLayoutSegment === null && path === '') || selectedLayoutSegment === path;
  return (
    <li className="nav-item">
      <Link className={`${isActive ? 'active' : ''}nav-link`} href={tabPath} scroll={false}>
        {title}
      </Link>
    </li>
  );
}
