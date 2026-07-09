'use client';

import React from 'react';
import { Address } from '@/app/(shared)/components/Address';
import { Copyable } from '@/app/(shared)/components/Copyable';
import { Epoch } from '@/app/(shared)/components/common/Epoch';
import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { LoadingCard } from '@/app/(shared)/components/common/LoadingCard';
import { Slot } from '@/app/(shared)/components/common/Slot';
import { SolBalance } from '@/app/(shared)/components/SolBalance';
import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { FetchStatus, useBlock, useFetchBlock } from '@/app/(core)/providers/block';
import { useCluster } from '@/app/(core)/providers/cluster';
import { ClusterStatus } from '@/app/(shared)/utils/cluster';
import { getEpochForSlot } from '@/app/(shared)/utils/epoch-schedule';
import { displayTimestampUtc } from '@/app/(shared)/utils/date';
import {
  BlockAccountsCard,
  BlockHistoryCard,
  BlockProgramsCard,
  BlockRewardsCard,
} from '@/app/(features)/blocks/components';
import { Box, CheckCircle2, Coins, XCircle } from 'lucide-react';

type Props = {
  params: {
    slot: string;
  };
};

export default function BlockDetailsPageClient({ params: { slot } }: Props) {
  const slotNumber = Number(slot);
  const invalid = isNaN(slotNumber) || slotNumber >= Number.MAX_SAFE_INTEGER || slotNumber % 1 !== 0;

  return (
    <div className="container mx-auto -mt-12 px-4">
      <div className="header">
        <div className="header-body">
          <h6 className="header-pretitle">Details</h6>
          <h2 className="header-title">Block</h2>
        </div>
      </div>
      {invalid ? (
        <ErrorCard text={`Block ${slot} is not valid`} />
      ) : (
        <BlockOverview slotNumber={slotNumber} />
      )}
    </div>
  );
}

function BlockOverview({ slotNumber }: { slotNumber: number }) {
  const confirmedBlock = useBlock(slotNumber);
  const fetchBlock = useFetchBlock();
  const { status, clusterInfo } = useCluster();

  const epoch = React.useMemo(() => {
    if (clusterInfo) {
      return getEpochForSlot(clusterInfo.epochSchedule, BigInt(slotNumber));
    }
    return undefined;
  }, [clusterInfo, slotNumber]);

  React.useEffect(() => {
    if (!confirmedBlock && status === ClusterStatus.Connected) {
      fetchBlock(slotNumber);
    }
  }, [slotNumber, status, confirmedBlock, fetchBlock]);

  // --- States -------------------------------------------------------------
  if (status !== ClusterStatus.Connected && !confirmedBlock) {
    return <LoadingCard message="Connecting to cluster" />;
  }
  if (!confirmedBlock || confirmedBlock.status === FetchStatus.Fetching) {
    return <LoadingCard message={`Loading block ${slotNumber.toLocaleString('en-US')}`} />;
  }
  if (confirmedBlock.status === FetchStatus.FetchFailed) {
    const reason = confirmedBlock.data?.errorMessage;
    // Pruned/skipped blocks are expected on a ledger-limited validator — show the node's reason.
    const pruned = reason && /cleaned up|does not exist|not available|was skipped/i.test(reason);
    return (
      <ErrorCard
        text={pruned ? reason! : `Failed to fetch block ${slotNumber.toLocaleString('en-US')}`}
        retry={() => fetchBlock(slotNumber)}
      />
    );
  }
  if (!confirmedBlock.data?.block) {
    return (
      <ErrorCard
        text={`Block ${slotNumber.toLocaleString('en-US')} was skipped or not yet confirmed on this cluster`}
        retry={() => fetchBlock(slotNumber)}
      />
    );
  }

  const block = confirmedBlock.data.block;
  const { blockLeader, childSlot, parentLeader } = confirmedBlock.data;
  const blockAny = block as any; // provider type is structurally compatible with VersionedBlockResponse

  // --- Derived metrics ----------------------------------------------------
  const txs = block.transactions;
  const txCount = txs.length;
  const successCount = txs.filter(tx => tx.meta && !tx.meta.err).length;
  const failedCount = txs.filter(tx => tx.meta?.err).length;
  // meta.fee comes back as bigint from the kit RPC — coerce to number before summing.
  const totalFees = txs.reduce((sum, tx) => sum + Number(tx.meta?.fee ?? 0), 0);
  const successRate = txCount > 0 ? (successCount / txCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Box} label="Transactions" value={txCount.toLocaleString('en-US')} accent="text-primary" />
        <StatTile
          icon={CheckCircle2}
          label="Successful"
          value={`${successCount.toLocaleString('en-US')} (${successRate.toFixed(1)}%)`}
          accent="text-green-500"
        />
        <StatTile
          icon={XCircle}
          label="Failed"
          value={failedCount.toLocaleString('en-US')}
          accent="text-red-500"
        />
        <StatTile
          icon={Coins}
          label="Total Fees"
          value={<SolBalance lamports={totalFees} maximumFractionDigits={6} />}
          accent="text-yellow-500"
        />
      </div>

      {/* Overview table */}
      <Card>
        <div className="border-b px-6 py-4">
          <h3 className="mb-0 text-lg font-semibold">Overview</h3>
        </div>
        <TableCardBody>
          <tr>
            <td className="w-full">Slot</td>
            <td className="font-mono lg:text-right">
              <Slot slot={slotNumber} />
            </td>
          </tr>
          <tr>
            <td className="w-full">Blockhash</td>
            <td className="lg:text-right">
              <Copyable text={block.blockhash}>
                <span className="font-mono">{block.blockhash}</span>
              </Copyable>
            </td>
          </tr>
          {block.blockHeight !== null && block.blockHeight !== undefined && (
            <tr>
              <td className="w-full">Block Height</td>
              <td className="font-mono lg:text-right">{block.blockHeight.toLocaleString('en-US')}</td>
            </tr>
          )}
          {block.blockTime ? (
            <tr>
              <td className="w-full">Timestamp (UTC)</td>
              <td className="font-mono lg:text-right">{displayTimestampUtc(block.blockTime * 1000, true)}</td>
            </tr>
          ) : (
            <tr>
              <td className="w-full">Timestamp</td>
              <td className="text-muted-foreground lg:text-right">Unavailable</td>
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
            <td className="w-full">Leader</td>
            <td className="lg:text-right">
              {blockLeader ? (
                <Address pubkey={blockLeader} link alignRight />
              ) : (
                <span className="text-muted-foreground">Unknown</span>
              )}
            </td>
          </tr>
          <tr>
            <td className="w-full">Parent Slot</td>
            <td className="font-mono lg:text-right">
              <Slot slot={block.parentSlot} link />
            </td>
          </tr>
          {parentLeader && (
            <tr>
              <td className="w-full">Parent Leader</td>
              <td className="lg:text-right">
                <Address pubkey={parentLeader} link alignRight />
              </td>
            </tr>
          )}
          <tr>
            <td className="w-full">Previous Blockhash</td>
            <td className="lg:text-right">
              <Copyable text={block.previousBlockhash}>
                <span className="font-mono">{block.previousBlockhash}</span>
              </Copyable>
            </td>
          </tr>
          {childSlot !== undefined && (
            <tr>
              <td className="w-full">Child Slot</td>
              <td className="font-mono lg:text-right">
                <Slot slot={childSlot} link />
              </td>
            </tr>
          )}
        </TableCardBody>
      </Card>

      {/* Rewards (renders null when empty) */}
      <BlockRewardsCard block={blockAny} />

      {/* Program & account usage breakdowns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BlockProgramsCard block={blockAny} />
        <BlockAccountsCard block={blockAny} blockSlot={slotNumber} />
      </div>

      {/* Full transaction history with filtering */}
      <BlockHistoryCard block={blockAny} epoch={epoch} />
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Icon className={`h-3.5 w-3.5 ${accent}`} />
          {label}
        </div>
        <p className="font-mono text-lg font-black leading-none">{value}</p>
      </CardContent>
    </Card>
  );
}
