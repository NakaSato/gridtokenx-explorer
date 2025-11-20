'use client';

import { Address } from '@/app/(shared)/components/common/Address';
import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { LoadingCard } from '@/app/(shared)/components/common/LoadingCard';
import { Signature } from '@/app/(shared)/components/common/Signature';
import { useAccountHistory } from '@/app/(core)/providers/accounts';
import { useFetchAccountHistory } from '@/app/(core)/providers/accounts/history';
import { FetchStatus } from '@/app/(core)/providers/cache';
import { toAddress, addressToPublicKey } from '@/app/(shared)/utils/rpc';
import { ParsedInstruction, ParsedTransactionWithMeta, PartiallyDecodedInstruction, PublicKey } from '@solana/web3.js';
import { getTokenInstructionName, InstructionContainer } from '@/app/(shared)/utils/instruction';
import React, { useMemo } from 'react';
import Moment from 'react-moment';

import { getTransactionRows, HistoryCardFooter, HistoryCardHeader } from '../HistoryCardComponents';
import { extractMintDetails, MintDetails } from './common';

export function TokenInstructionsCard({ address }: { address: string }) {
  const pubkey = useMemo(() => addressToPublicKey(toAddress(address)), [address]);
  const history = useAccountHistory(address);
  const fetchAccountHistory = useFetchAccountHistory();
  const refresh = () => fetchAccountHistory(pubkey, true, true);
  const loadMore = () => fetchAccountHistory(pubkey, true);

  const transactionRows = React.useMemo(() => {
    if (history?.data?.fetched) {
      return getTransactionRows(history.data.fetched);
    }
    return [];
  }, [history]);

  React.useEffect(() => {
    if (!history || !history.data?.transactionMap?.size) {
      refresh();
    }
  }, [address]); // eslint-disablline react-hooks/exhaustivdeps

  const { hasTimestamps, detailsList } = React.useMemo(() => {
    const detailedHistoryMap = history?.data?.transactionMap || new Map<string, ParsedTransactionWithMeta>();
    const hasTimestamps = transactionRows.some(element => element.blockTime);
    const detailsList: React.ReactNode[] = [];
    const mintMap = new Map<string, MintDetails>();

    transactionRows.forEach(({ signatureInfo, signature, blockTime, statusClass, statusText }) => {
      const transactionWithMeta = detailedHistoryMap.get(signature);
      if (!transactionWithMeta) return;

      extractMintDetails(transactionWithMeta, mintMap);

      const instructions: (ParsedInstruction | PartiallyDecodedInstruction)[] = [];

      InstructionContainer.create(transactionWithMeta).instructions.forEach(({ instruction, inner }) => {
        if (isRelevantInstruction(pubkey, address, mintMap, instruction)) {
          instructions.push(instruction);
        }
        instructions.push(...inner.filter(instruction => isRelevantInstruction(pubkey, address, mintMap, instruction)));
      });

      instructions.forEach((ix, index) => {
        const programId = ix.programId;

        const instructionName = getTokenInstructionName(transactionWithMeta, ix, signatureInfo);

        if (instructionName) {
          detailsList.push(
            <tr key={signature + index}>
              <td>
                <Signature signature={signature} link truncateChars={48} />
              </td>

              {hasTimestamps && (
                <td className="text-muted-foreground">{blockTime && <Moment date={blockTime * 1000} fromNow />}</td>
              )}

              <td>{instructionName}</td>

              <td>
                <Address pubkey={programId} link truncate truncateChars={16} />
              </td>

              <td>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusClass === 'success' ? 'bg-green-100 text-green-800' : 'bg-gray-800 text-white'
                  }`}
                >
                  {statusText}
                </span>
              </td>
            </tr>,
          );
        }
      });
    });

    return {
      detailsList,
      hasTimestamps,
    };
  }, [history, transactionRows, address, pubkey]);

  if (!history) {
    return null;
  }

  if (history?.data === undefined) {
    if (history.status === FetchStatus.Fetching) {
      return <LoadingCard message="Loading token instructions" />;
    }

    return <ErrorCard retry={refresh} text="Failed to fetch token instructions" />;
  }

  const fetching = history.status === FetchStatus.Fetching;
  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <HistoryCardHeader fetching={fetching} refresh={() => refresh()} title="Token Instructions" />
      <div className="mb-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-muted-foreground w-1">Transaction Signature</th>
              {hasTimestamps && <th className="text-muted-foreground">Age</th>}
              <th className="text-muted-foreground">Instruction</th>
              <th className="text-muted-foreground">Program</th>
              <th className="text-muted-foreground">Result</th>
            </tr>
          </thead>
          <tbody className="list">{detailsList}</tbody>
        </table>
      </div>
      <HistoryCardFooter fetching={fetching} foundOldest={history.data.foundOldest} loadMore={() => loadMore()} />
    </div>
  );
}

function isRelevantInstruction(
  pubkey: PublicKey,
  address: string,
  mintMap: Map<string, MintDetails>,
  instruction: ParsedInstruction | PartiallyDecodedInstruction,
) {
  if ('accounts' in instruction) {
    return instruction.accounts.some(
      account => account.equals(pubkey) || mintMap.get(account.toBase58())?.mint === address,
    );
  } else if (typeof instruction.parsed === 'object' && 'info' in instruction.parsed) {
    return Object.values(instruction.parsed.info).some(
      value => value === address || (typeof value === 'string' && mintMap.get(value)?.mint === address),
    );
  }
  return false;
}
