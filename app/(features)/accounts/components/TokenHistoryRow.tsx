import { isTokenProgramData } from '@/app/(core)/providers/accounts';
import { isTokenProgramId } from '@/app/(core)/providers/accounts/tokens';
import { useCluster } from '@/app/(core)/providers/cluster';
import { CacheEntry } from '@/app/(core)/providers/cache';
import {
  Details,
  useFetchTransactionDetails,
} from '@/app/(core)/providers/transactions/parsed';
import { Address } from '@/app/(shared)/components/Address';
import { Slot } from '@/app/(shared)/components/Slot';
import { TableCell, TableRow } from '@/app/(shared)/components/ui/table';
import { Cluster } from '@/app/(shared)/utils/cluster';
import { INNER_INSTRUCTIONS_START_SLOT } from '@/app/(shared)/utils/index';
import { getTokenProgramInstructionName } from '@/app/(shared)/utils/instruction';
import { intoTransactionInstruction } from '@/app/(shared)/utils/tx';
import { ConfirmedSignatureInfo, ParsedInstruction, PartiallyDecodedInstruction, PublicKey } from '@solana/web3.js';
import React from 'react';
import { MinusSquare, PlusSquare } from 'react-feather';

type InstructionType = {
  name: string;
  innerInstructions: (ParsedInstruction | PartiallyDecodedInstruction)[];
};

export const TokenHistoryRow = React.memo(function TokenHistoryRow({
  mint,
  tx,
  details,
}: {
  mint: PublicKey;
  tx: ConfirmedSignatureInfo;
  details: CacheEntry<Details> | undefined;
}) {
  const fetchDetails = useFetchTransactionDetails();
  const { cluster } = useCluster();

  // Fetch details on load
  React.useEffect(() => {
    if (!details) fetchDetails(tx.signature);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  let statusText: string;
  let statusClass: string;
  if (tx.err) {
    statusClass = 'bg-yellow-100 text-yellow-800';
    statusText = 'Failed';
  } else {
    statusClass = 'bg-green-100 text-green-800';
    statusText = 'Success';
  }

  const transactionWithMeta = details?.data?.transactionWithMeta;
  const instructions = transactionWithMeta?.transaction.message.instructions;
  if (!instructions)
    return (
      <TableRow key={tx.signature}>
        <TableCell className="w-1">
          <Slot slot={tx.slot} link />
        </TableCell>

        <TableCell>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
            {statusText}
          </span>
        </TableCell>

        <TableCell>
          <Address pubkey={mint} link truncate />
        </TableCell>

        <TableCell>
          <span className="mr-2 inline-block h-4 w-4 animate-pulse rounded-full bg-current align-text-top"></span>
          Loading
        </TableCell>

        <TableCell>
          <span className="font-mono text-xs">{tx.signature.slice(0, 8)}...</span>
        </TableCell>
      </TableRow>
    );

  let tokenInstructionNames: InstructionType[] = [];

  if (transactionWithMeta) {
    tokenInstructionNames = instructions
      .map((ix, index): InstructionType | undefined => {
        let name = 'Unknown';

        const innerInstructions: (ParsedInstruction | PartiallyDecodedInstruction)[] = [];

        if (
          transactionWithMeta.meta?.innerInstructions &&
          (cluster !== Cluster.MainnetBeta || transactionWithMeta.slot >= INNER_INSTRUCTIONS_START_SLOT)
        ) {
          transactionWithMeta.meta.innerInstructions.forEach(ix => {
            if (ix.index === index) {
              ix.instructions.forEach(inner => {
                innerInstructions.push(inner);
              });
            }
          });
        }

        let transactionInstruction;
        if (transactionWithMeta?.transaction) {
          transactionInstruction = intoTransactionInstruction(transactionWithMeta.transaction as any, ix);
        }

        if ('parsed' in ix) {
          if (isTokenProgramData(ix)) {
            name = getTokenProgramInstructionName(ix, tx);
          } else {
            return undefined;
          }
        } else {
          if (ix.accounts.findIndex((account: any) => isTokenProgramId(account)) >= 0) {
            name = 'Unknown (Inner)';
          } else {
            return undefined;
          }
        }

        return {
          innerInstructions,
          name,
        };
      })
      .filter((name: any) => name !== undefined) as InstructionType[];
  }

  return (
    <>
      {tokenInstructionNames.map((instructionType, index) => {
        return (
          <TableRow key={index}>
            <TableCell className="w-1">
              <Slot slot={tx.slot} link />
            </TableCell>

            <TableCell>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                {statusText}
              </span>
            </TableCell>

            <TableCell className="forced-truncate">
              <Address pubkey={mint} link truncateUnknown fetchTokenLabelInfo />
            </TableCell>

            <TableCell>
              <InstructionDetails instructionType={instructionType} tx={tx} />
            </TableCell>

            <TableCell className="forced-truncate">
              <span className="font-mono text-xs">{tx.signature.slice(0, 8)}...</span>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
});

function InstructionDetails({ instructionType, tx }: { instructionType: InstructionType; tx: ConfirmedSignatureInfo }) {
  const [expanded, setExpanded] = React.useState(false);

  const instructionTypes = instructionType.innerInstructions
    .map(ix => {
      if ('parsed' in ix && isTokenProgramData(ix)) {
        return getTokenProgramInstructionName(ix, tx);
      }
      return undefined;
    })
    .filter(type => type !== undefined);

  return (
    <>
      <p className="tree">
        {instructionTypes.length > 0 && (
          <span
            onClick={e => {
              e.preventDefault();
              setExpanded(!expanded);
            }}
            className="mr-2 cursor-pointer"
          >
            {expanded ? (
              <MinusSquare className="align-text-top" size={13} />
            ) : (
              <PlusSquare className="align-text-top" size={13} />
            )}
          </span>
        )}
        {instructionType.name}
      </p>
      {expanded && (
        <ul className="tree">
          {instructionTypes.map((type, index) => {
            return <li key={index}>{type}</li>;
          })}
        </ul>
      )}
    </>
  );
}


