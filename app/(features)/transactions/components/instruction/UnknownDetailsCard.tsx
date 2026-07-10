import { useCluster } from '@/app/(core)/providers/cluster';
import { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { getProgramName } from '@/app/(shared)/utils/tx';
import { isPublicKeyLike } from '@/app/(shared)/utils/rpc';
import React from 'react';

import { InstructionCard } from './InstructionCard';

export function UnknownDetailsCard({
  ix,
  index,
  result,
  innerCards,
  childIndex,
  InstructionCardComponent = InstructionCard,
}: {
  ix: TransactionInstruction | ParsedInstruction;
  index: number;
  result: SignatureResult;
  innerCards?: JSX.Element[];
  childIndex?: number;
  InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
}) {
  const { cluster } = useCluster();
  // `ix.programId` is usually a web3.js PublicKey, but an unknown/invalid
  // program address that failed `new PublicKey()` in toLegacyParsedTransaction
  // stays a base58 string — calling `.toBase58()` on it throws. Accept both.
  const programAddress = isPublicKeyLike(ix.programId) ? ix.programId.toBase58() : String(ix.programId);
  const programName = getProgramName(programAddress, cluster);
  return (
    <InstructionCardComponent
      ix={ix}
      index={index}
      result={result}
      title={`${programName}: Unknown Instruction`}
      innerCards={innerCards}
      childIndex={childIndex}
      defaultRaw
    />
  );
}
