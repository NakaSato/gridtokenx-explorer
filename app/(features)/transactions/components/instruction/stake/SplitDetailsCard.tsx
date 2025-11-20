import { Address } from '@/app/(shared)/components/common/Address';
import { SolBalance } from '@/app/(shared)/components/SolBalance';
import { ParsedInstruction, SignatureResult, StakeProgram } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { SplitInfo } from './types';

export function SplitDetailsCard(props: {
  ix: ParsedInstruction;
  index: number;
  result: SignatureResult;
  info: SplitInfo;
  innerCards?: React.ReactElement[];
  childIndex?: number;
}) {
  const { ix, index, result, info, innerCards, childIndex } = props;

  return (
    <InstructionCard
      ix={ix}
      index={index}
      result={result}
      title="Stake Program: Split Stake"
      innerCards={innerCards}
      childIndex={childIndex}
    >
      <tr>
        <td>Program</td>
        <td className="lg:text-right">
          <Address pubkey={StakeProgram.programId} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Stake Address</td>
        <td className="lg:text-right">
          <Address pubkey={info.stakeAccount} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Authority Address</td>
        <td className="lg:text-right">
          <Address pubkey={info.stakeAuthority} alignRight link />
        </td>
      </tr>

      <tr>
        <td>New Stake Address</td>
        <td className="lg:text-right">
          <Address pubkey={info.newSplitAccount} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Split Amount (SOL)</td>
        <td className="lg:text-right">
          <SolBalance lamports={info.lamports} />
        </td>
      </tr>
    </InstructionCard>
  );
}
