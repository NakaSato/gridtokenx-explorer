import { useCluster } from '@/app/(core)/providers/cluster';
import { estimateRequestedComputeUnits } from '@/app/(shared)/utils/compute-units-schedule';
import { parseProgramLogs } from '@/app/(shared)/utils/program-logs';
import { toAddress } from '@/app/(shared)/utils/rpc';
import {
  ConfirmedTransactionMeta,
  PublicKey,
  TransactionSignature,
  VersionedBlockResponse,
  VOTE_PROGRAM_ID,
} from '@solana/web3.js';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
import React from 'react';

export type TransactionWithInvocations = {
  index: number;
  signature?: TransactionSignature;
  meta: ConfirmedTransactionMeta | null;
  invocations: Map<string, number>;
  computeUnits?: number;
  costUnits?: number;
  reservedComputeUnits?: number;
  logTruncated: boolean;
  payer: PublicKey;
};

// ... (imports need PublicKey)

      return {
        computeUnits,
        costUnits,
        index,
        invocations,
        logTruncated,
        meta: tx.meta,
        reservedComputeUnits,
        signature,
        payer,
      };

export type SortMode = 'index' | 'compute' | 'txnCost' | 'fee' | 'reservedCUs';

export const ALL_TRANSACTIONS = 'all';
export const HIDE_VOTES = '';

const useQueryProgramFilter = (query: ReadonlyURLSearchParams): string => {
  const filter = query.get('filter');
  return filter || '';
};

const useQueryAccountFilter = (query: ReadonlyURLSearchParams): string | null => {
  const filter = query.get('accountFilter');
  if (filter !== null) {
    try {
      // Validate it's a valid address
      toAddress(filter);
      return filter;
    } catch {
      /* empty */
    }
  }
  return null;
};

const useQuerySort = (query: ReadonlyURLSearchParams): SortMode => {
  const sort = query.get('sort');
  if (sort === 'compute') return 'compute';
  if (sort === 'txnCost') return 'txnCost';
  if (sort === 'fee') return 'fee';
  if (sort === 'reservedCUs') return 'reservedCUs';
  return 'index';
};

export function useBlockHistory(block: VersionedBlockResponse, epoch: bigint | undefined) {
  const currentSearchParams = useSearchParams();
  const programFilter = useQueryProgramFilter(currentSearchParams);
  const accountFilter = useQueryAccountFilter(currentSearchParams);
  const sortMode = useQuerySort(currentSearchParams);
  const { cluster } = useCluster();

  const { transactions, invokedPrograms } = React.useMemo(() => {
    const invokedPrograms = new Map<string, number>();

    const transactions: TransactionWithInvocations[] = block.transactions.map((tx, index) => {
      let signature: TransactionSignature | undefined;
      if (tx.transaction.signatures.length > 0) {
        signature = tx.transaction.signatures[0];
      }

      const programIndexes = tx.transaction.message.compiledInstructions
        .map(ix => ix.programIdIndex)
        .concat(
          tx.meta?.innerInstructions?.flatMap(ix => {
            return ix.instructions.map(ix => ix.programIdIndex);
          }) || [],
        );

      const indexMap = new Map<number, number>();
      programIndexes.forEach(programIndex => {
        const count = indexMap.get(programIndex) || 0;
        indexMap.set(programIndex, count + 1);
      });

      const invocations = new Map<string, number>();
      const accountKeys = tx.transaction.message.getAccountKeys({
        accountKeysFromLookups: tx.meta?.loadedAddresses,
      });
      indexMap.forEach((count, i) => {
        const programId = accountKeys.get(i)!.toBase58();
        invocations.set(programId, count);
        const programTransactionCount = invokedPrograms.get(programId) || 0;
        invokedPrograms.set(programId, programTransactionCount + 1);
      });

      let logTruncated = false;
      let computeUnits: number | undefined = undefined;
      try {
        const parsedLogs = parseProgramLogs(tx.meta?.logMessages ?? [], tx.meta?.err ?? null, cluster);

        logTruncated = parsedLogs[parsedLogs.length - 1].truncated;
        computeUnits = parsedLogs.map(({ computeUnits }) => computeUnits).reduce((sum, next) => sum + next);
      } catch (err) {
        // ignore parsing errors because some old logs aren't parsable
      }

      let costUnits: number | undefined = undefined;
      try {
        costUnits = tx.meta?.costUnits ?? 0;
      } catch (err) {
        // ignore parsing errors because some old logs aren't parsable
      }

      // Calculate reserved compute units
      const reservedComputeUnits = estimateRequestedComputeUnits(tx, epoch, cluster);

      const payer = tx.transaction.message.staticAccountKeys[0];

      return {
        computeUnits,
        costUnits,
        index,
        invocations,
        logTruncated,
        meta: tx.meta,
        reservedComputeUnits,
        signature,
        payer,
      };
    });
    return { invokedPrograms, transactions };
  }, [block, cluster, epoch]);

  const [filteredTransactions, showComputeUnits] = React.useMemo((): [TransactionWithInvocations[], boolean] => {
    const voteFilter = VOTE_PROGRAM_ID.toBase58();
    const filteredTxs: TransactionWithInvocations[] = transactions
      .filter(({ invocations }) => {
        if (programFilter === ALL_TRANSACTIONS) {
          return true;
        } else if (programFilter === HIDE_VOTES) {
          // hide vote txs that don't invoke any other programs
          return !(invocations.has(voteFilter) && invocations.size === 1);
        }
        return invocations.has(programFilter);
      })
      .filter(({ index }) => {
        if (accountFilter === null) {
          return true;
        }

        const tx = block.transactions[index];
        const accountKeys = tx.transaction.message.getAccountKeys({
          accountKeysFromLookups: tx.meta?.loadedAddresses,
        });
        return accountKeys
          .keySegments()
          .flat()
          .find(key => key.toBase58() === accountFilter);
      });

    const showComputeUnits = filteredTxs.every(tx => tx.computeUnits !== undefined);

    if (sortMode === 'compute' && showComputeUnits) {
      filteredTxs.sort((a, b) => b.computeUnits! - a.computeUnits!);
    } else if (sortMode === 'txnCost') {
      filteredTxs.sort((a, b) => b.costUnits! - a.costUnits!);
    } else if (sortMode === 'fee') {
      filteredTxs.sort((a, b) => (b.meta?.fee || 0) - (a.meta?.fee || 0));
    } else if (sortMode === 'reservedCUs') {
      filteredTxs.sort((a, b) => (b.reservedComputeUnits || 0) - (a.reservedComputeUnits || 0));
    }

    return [filteredTxs, showComputeUnits];
  }, [block.transactions, transactions, programFilter, accountFilter, sortMode]);

  return {
    accountFilter,
    filteredTransactions,
    invokedPrograms,
    programFilter,
    showComputeUnits,
    transactions,
  };
}
