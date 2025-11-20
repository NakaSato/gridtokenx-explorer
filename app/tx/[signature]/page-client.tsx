'use client';

import { Address } from '@/app/(shared)/components/common/Address';
import { BalanceDelta } from '@/app/(shared)/components/common/BalanceDelta';
import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { InfoTooltip } from '@/app/(shared)/components/common/InfoTooltip';
import { LoadingCard } from '@/app/(shared)/components/common/LoadingCard';
import { Signature } from '@/app/(shared)/components/common/Signature';
import { Slot } from '@/app/(shared)/components/common/Slot';
import { SolBalance } from '@/app/(shared)/components/common/SolBalance';
import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { SignatureContext } from '@/app/(shared)/components/instruction/SignatureContext';
import { InstructionsSection } from '@/app/(shared)/components/transaction/InstructionsSection';
import { ProgramLogSection } from '@/app/(shared)/components/transaction/ProgramLogSection';
import { TokenBalancesCard } from '@/app/(shared)/components/transaction/TokenBalancesCard';
import { FetchStatus } from '@/app/(core)/providers/cache';
import { useCluster } from '@/app/(core)/providers/cluster';
import {
  TransactionStatusInfo,
  useFetchTransactionStatus,
  useTransactionDetails,
  useTransactionStatus,
} from '@providers/transactions';
import { useFetchTransactionDetails } from '@providers/transactions/parsed';
import { ParsedTransaction, SystemInstruction, SystemProgram, TransactionSignature } from '@solana/web3.js';
import { Cluster, ClusterStatus } from '@/app/(shared)/utils/cluster';
import { displayTimestamp } from '@/app/(shared)/utils/date';
import { SignatureProps } from '@/app/(shared)/utils/index';
import { getTransactionInstructionError } from '@/app/(shared)/utils/program-err';
import { intoTransactionInstruction } from '@/app/(shared)/utils/tx';
import { useClusterPath } from '@/app/(shared)/utils/url';
import useTabVisibility from '@/app/(shared)/utils/use-tab-visibility';
import { BigNumber } from 'bignumber.js';
import bs58 from 'bs58';
import Link from 'next/link';
import React, { Suspense, useEffect, useState } from 'react';
import { RefreshCw, Settings } from 'react-feather';

import { estimateRequestedComputeUnitsForParsedTransaction } from '@/app/(shared)/utils/compute-units-schedule';
import { getEpochForSlot } from '@/app/(shared)/utils/epoch-schedule';

const AUTO_REFRESH_INTERVAL = 2000;
const ZERO_CONFIRMATION_BAILOUT = 5;

enum AutoRefresh {
  Active,
  Inactive,
  BailedOut,
}

type AutoRefreshProps = {
  autoRefresh: AutoRefresh;
};

type Props = Readonly<{
  params: SignatureProps;
}>;

function getTransactionErrorReason(
  info: TransactionStatusInfo,
  tx: ParsedTransaction | undefined,
): { errorReason: string; errorLink?: string } {
  if (typeof info.result.err === 'string') {
    return { errorReason: `Runtime Error: "${info.result.err}"` };
  }

  const programError = getTransactionInstructionError(info.result.err);
  if (programError !== undefined) {
    return { errorReason: `Program Error: "Instruction #${programError.index + 1} Failed"` };
  }

  const { InsufficientFundsForRent } = info.result.err as { InsufficientFundsForRent?: { account_index: number } };
  if (InsufficientFundsForRent !== undefined) {
    if (tx) {
      const address = tx.message.accountKeys[InsufficientFundsForRent.account_index].pubkey;
      return { errorLink: `/address/${address}`, errorReason: `Insufficient Funds For Rent: ${address}` };
    }
    return { errorReason: `Insufficient Funds For Rent: Account #${InsufficientFundsForRent.account_index + 1}` };
  }

  return { errorReason: `Unknown Error: "${JSON.stringify(info.result.err)}"` };
}

export default function TransactionDetailsPageClient({ params: { signature: raw } }: Props) {
  let signature: TransactionSignature | undefined;

  try {
    const decoded = bs58.decode(raw);
    if (decoded.length === 64) {
      signature = raw;
    }
  } catch (err) {
    /* empty */
  }

  const status = useTransactionStatus(signature);
  const clusterStatus = useCluster().status;
  const [zeroConfirmationRetries, setZeroConfirmationRetries] = useState(0);
  const { visible: isTabVisible } = useTabVisibility();

  let autoRefresh = AutoRefresh.Inactive;
  if (!isTabVisible) {
    autoRefresh = AutoRefresh.Inactive;
  } else if (zeroConfirmationRetries >= ZERO_CONFIRMATION_BAILOUT) {
    autoRefresh = AutoRefresh.BailedOut;
  } else if (status?.data?.info && status.data.info.confirmations !== 'max') {
    autoRefresh = AutoRefresh.Active;
  }

  useEffect(() => {
    if (status?.status === FetchStatus.Fetched && status.data?.info && status.data.info.confirmations === 0) {
      setZeroConfirmationRetries(retries => retries + 1);
    }
  }, [status]);

  useEffect(() => {
    if (status?.status === FetchStatus.Fetching && autoRefresh === AutoRefresh.BailedOut) {
      setZeroConfirmationRetries(0);
    }
  }, [status, autoRefresh, setZeroConfirmationRetries]);

  return (
    <div className="container mx-auto -mt-12 px-4">
      <div className="header">
        <div className="header-body">
          <h6 className="header-pretitle">Details</h6>
          <h2 className="header-title">Transaction</h2>
        </div>
      </div>
      {signature === undefined ? (
        <ErrorCard text={`Signature "${raw}" is not valid`} />
      ) : clusterStatus === ClusterStatus.Failure ? (
        <ErrorCard text="RPC is not responding. Please change your RPC url and try again." />
      ) : (
        <SignatureContext.Provider value={signature}>
          <StatusCard signature={signature} autoRefresh={autoRefresh} />
          <Suspense fallback={<LoadingCard message="Loading transaction details" />}>
            <DetailsSection signature={signature} />
          </Suspense>
        </SignatureContext.Provider>
      )}
    </div>
  );
}

function StatusCard({ signature, autoRefresh }: SignatureProps & AutoRefreshProps) {
  const fetchStatus = useFetchTransactionStatus();
  const status = useTransactionStatus(signature);
  const details = useTransactionDetails(signature);
  const { cluster, clusterInfo, name: clusterName, status: clusterStatus, url: clusterUrl } = useCluster();
  const inspectPath = useClusterPath({ pathname: `/tx/${signature}/inspect` });

  // Fetch transaction on load
  useEffect(() => {
    if (!status && clusterStatus === ClusterStatus.Connected) {
      fetchStatus(signature);
    }
  }, [signature, clusterStatus]); // eslint-disablline react-hooks/exhaustivdeps

  // Effect to set and clear interval for auto-refresh
  useEffect(() => {
    if (autoRefresh === AutoRefresh.Active) {
      const intervalHandle: NodeJS.Timeout = setInterval(() => fetchStatus(signature), AUTO_REFRESH_INTERVAL);

      return () => {
        clearInterval(intervalHandle);
      };
    }
  }, [autoRefresh, fetchStatus, signature]);

  if (!status || (status.status === FetchStatus.Fetching && autoRefresh === AutoRefresh.Inactive)) {
    return <LoadingCard />;
  } else if (status.status === FetchStatus.FetchFailed) {
    return <ErrorCard retry={() => fetchStatus(signature)} text="Fetch Failed" />;
  } else if (!status.data?.info) {
    if (clusterInfo && clusterInfo.firstAvailableBlock > 0) {
      return (
        <ErrorCard
          retry={() => fetchStatus(signature)}
          text="Not Found"
          subtext={`Note: Transactions processed before block ${clusterInfo.firstAvailableBlock} are not available at this time`}
        />
      );
    }
    return <ErrorCard retry={() => fetchStatus(signature)} text="Not Found" />;
  }

  const { info } = status.data;

  const transactionWithMeta = details?.data?.transactionWithMeta;
  const fee = transactionWithMeta?.meta?.fee;
  const computeUnitsConsumed = transactionWithMeta?.meta?.computeUnitsConsumed;
  const costUnits = transactionWithMeta?.meta?.costUnits;
  const transaction = transactionWithMeta?.transaction;
  const blockhash = transaction?.message.recentBlockhash;
  const epoch = clusterInfo ? getEpochForSlot(clusterInfo.epochSchedule, BigInt(info.slot)) : undefined;
  const reservedCUs = transactionWithMeta?.transaction
    ? estimateRequestedComputeUnitsForParsedTransaction(transactionWithMeta.transaction, epoch, cluster)
    : undefined;
  const version = transactionWithMeta?.version;
  const isNonce = (() => {
    if (!transaction || transaction.message.instructions.length < 1) {
      return false;
    }

    const ix = intoTransactionInstruction(transaction, transaction.message.instructions[0]);
    return (
      ix &&
      SystemProgram.programId.equals(ix.programId) &&
      SystemInstruction.decodeInstructionType(ix) === 'AdvanceNonceAccount'
    );
  })();

  let statusClass = 'success';
  let statusText = 'Success';
  let errorReason = undefined;
  let errorLink = undefined;

  if (info.result.err) {
    statusClass = 'warning';
    statusText = 'Error';

    const err = getTransactionErrorReason(info, transaction);
    errorReason = err.errorReason;
    if (err.errorLink !== undefined) {
      if (cluster === Cluster.MainnetBeta) {
        errorLink = err.errorLink;
      } else {
        errorLink = `${err.errorLink}?cluster=${clusterName.toLowerCase()}${
          cluster === Cluster.Custom ? `&customUrl=${clusterUrl}` : ''
        }`;
      }
    }
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex items-center border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Overview</h3>
        <Link
          className="mr-2 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100"
          href={inspectPath}
        >
          <Settings className="mr-2 align-text-top" size={13} />
          Inspect
        </Link>
        {autoRefresh === AutoRefresh.Active ? (
          <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-current"></span>
        ) : (
          <button
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-100"
            onClick={() => fetchStatus(signature)}
          >
            <RefreshCw className="mr-2 align-text-top" size={13} />
            Refresh
          </button>
        )}
      </div>

      <TableCardBody>
        <tr>
          <td>Signature</td>
          <td className="lg:text-right">
            <Signature signature={signature} alignRight />
          </td>
        </tr>

        <tr>
          <td>Result</td>
          <td className="lg:text-right">
            <h3 className="mb-0">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  statusClass === 'success'
                    ? 'bg-green-100 text-green-800'
                    : statusClass === 'warning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-800 text-white'
                }`}
              >
                {statusText}
              </span>
            </h3>
          </td>
        </tr>

        {errorReason !== undefined && (
          <tr>
            <td>Error</td>
            <td className="lg:text-right">
              <h3 className="mb-0">
                {errorLink !== undefined ? (
                  <Link href={errorLink}>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusClass === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-800 text-white'
                      }`}
                    >
                      {errorReason}
                    </span>
                  </Link>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusClass === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-800 text-white'
                    }`}
                  >
                    {errorReason}
                  </span>
                )}
              </h3>
            </td>
          </tr>
        )}

        <tr>
          <td>Timestamp</td>
          <td className="lg:text-right">
            {(() => {
              // Try to get timestamp from status info first, fallback to transaction blockTime
              let timestamp: number | null = null;

              if (info.timestamp !== 'unavailable') {
                // Validate timestamp is reasonable (after year 2000)
                if (info.timestamp > 946684800) {
                  timestamp = info.timestamp;
                }
              }

              // Fallback to blockTime from transaction details
              if (!timestamp && transactionWithMeta?.blockTime) {
                timestamp = transactionWithMeta.blockTime;
              }

              return timestamp ? (
                <span className="font-mono">{displayTimestamp(timestamp * 1000)}</span>
              ) : (
                <InfoTooltip bottom right text="Timestamps are only available for confirmed blocks">
                  Unavailable
                </InfoTooltip>
              );
            })()}
          </td>
        </tr>

        <tr>
          <td>Confirmation Status</td>
          <td className="uppercase lg:text-right">{info.confirmationStatus || 'Unknown'}</td>
        </tr>

        <tr>
          <td>Confirmations</td>
          <td className="uppercase lg:text-right">{info.confirmations}</td>
        </tr>

        <tr>
          <td>Slot</td>
          <td className="lg:text-right">
            <Slot slot={info.slot} link />
          </td>
        </tr>

        {blockhash && (
          <tr>
            <td>
              {isNonce ? (
                'Nonce'
              ) : (
                <InfoTooltip text="Transactions use a previously confirmed blockhash as a nonce to prevent double spends">
                  Recent Blockhash
                </InfoTooltip>
              )}
            </td>
            <td className="lg:text-right">{blockhash}</td>
          </tr>
        )}

        {fee !== undefined && (
          <tr>
            <td>Fee (SOL)</td>
            <td className="lg:text-right">
              <SolBalance lamports={fee} />
            </td>
          </tr>
        )}

        {computeUnitsConsumed !== undefined && (
          <tr>
            <td>Compute units consumed</td>
            <td className="lg:text-right">{computeUnitsConsumed.toLocaleString('en-US')}</td>
          </tr>
        )}

        {costUnits !== undefined && (
          <tr>
            <td>Transaction cost</td>
            <td className="lg:text-right">{costUnits.toLocaleString('en-US')}</td>
          </tr>
        )}

        {reservedCUs !== undefined && (
          <tr>
            <td>Reserved CUs</td>
            <td className="lg:text-right">{reservedCUs.toLocaleString('en-US')}</td>
          </tr>
        )}

        {version !== undefined && (
          <tr>
            <td>Transaction Version</td>
            <td className="uppercase lg:text-right">{version}</td>
          </tr>
        )}
      </TableCardBody>
    </div>
  );
}

function DetailsSection({ signature }: SignatureProps) {
  const details = useTransactionDetails(signature);
  const fetchDetails = useFetchTransactionDetails();
  const status = useTransactionStatus(signature);
  const transactionWithMeta = details?.data?.transactionWithMeta;
  const transaction = transactionWithMeta?.transaction;
  const message = transaction?.message;
  const { status: clusterStatus } = useCluster();
  const refreshDetails = () => fetchDetails(signature);

  // Fetch details on load
  useEffect(() => {
    if (!details && clusterStatus === ClusterStatus.Connected && status?.status === FetchStatus.Fetched) {
      fetchDetails(signature);
    }
  }, [signature, clusterStatus, status]); // eslint-disablline react-hooks/exhaustivdeps

  if (!status?.data?.info) {
    return null;
  } else if (!details || details.status === FetchStatus.Fetching) {
    return <LoadingCard />;
  } else if (details.status === FetchStatus.FetchFailed) {
    return <ErrorCard retry={refreshDetails} text="Failed to fetch details" />;
  } else if (!transactionWithMeta || !message) {
    return <ErrorCard text="Details are not available" />;
  }

  return (
    <>
      <AccountsCard signature={signature} />
      <TokenBalancesCard signature={signature} />
      <InstructionsSection signature={signature} />
      <ProgramLogSection signature={signature} />
    </>
  );
}

function AccountsCard({ signature }: SignatureProps) {
  const details = useTransactionDetails(signature);

  const transactionWithMeta = details?.data?.transactionWithMeta;
  if (!transactionWithMeta) {
    return null;
  }

  const { meta, transaction } = transactionWithMeta;
  const { message } = transaction;

  if (!meta) {
    return <ErrorCard text="Transaction metadata is missing" />;
  }

  const accountRows = message.accountKeys.map((account, index) => {
    const pre = meta.preBalances[index];
    const post = meta.postBalances[index];
    const pubkey = account.pubkey;
    const key = account.pubkey.toBase58();
    const delta = new BigNumber(post).minus(new BigNumber(pre));

    return (
      <tr key={key}>
        <td>{index + 1}</td>
        <td>
          <Address pubkey={pubkey} link fetchTokenLabelInfo />
        </td>
        <td>
          <BalanceDelta delta={delta} isSol />
        </td>
        <td>
          <SolBalance lamports={post} />
        </td>
        <td>
          {index === 0 && (
            <span className="mr-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              Fee Payer
            </span>
          )}
          {account.signer && (
            <span className="mr-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              Signer
            </span>
          )}
          {account.writable && (
            <span className="mr-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              Writable
            </span>
          )}
          {message.instructions.find(ix => ix.programId.equals(pubkey)) && (
            <span className="mr-1 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              Program
            </span>
          )}
          {account.source === 'lookupTable' && (
            <span className="mr-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
              Address Table Lookup
            </span>
          )}
        </td>
      </tr>
    );
  });

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Account Input(s)</h3>
      </div>
      <div className="mb-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-muted-foreground">#</th>
              <th className="text-muted-foreground">Address</th>
              <th className="text-muted-foreground">Change (SOL)</th>
              <th className="text-muted-foreground">Post Balance (SOL)</th>
              <th className="text-muted-foreground">Details</th>
            </tr>
          </thead>
          <tbody className="list">{accountRows}</tbody>
        </table>
      </div>
    </div>
  );
}
