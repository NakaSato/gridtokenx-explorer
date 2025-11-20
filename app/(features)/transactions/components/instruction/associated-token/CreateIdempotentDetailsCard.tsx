import { Address } from '@/app/(shared)/components/common/Address';
import { ParsedInstruction, SignatureResult } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { CreateIdempotentInfo } from './types';

export function CreateIdempotentDetailsCard(props: {
  ix: ParsedInstruction;
  index: number;
  result: SignatureResult;
  info: CreateIdempotentInfo;
  innerCards?: JSX.Element[];
  childIndex?: number;
  InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
}) {
  const { ix, index, result, info, innerCards, childIndex, InstructionCardComponent = InstructionCard } = props;

  return (
    <InstructionCardComponent
      ix={ix}
      index={index}
      result={result}
      title="Associated Token Program: Create Idempotent"
      innerCards={innerCards}
      childIndex={childIndex}
    >
      <tr>
        <td>Source</td>
        <td className="lg:text-right">
          <Address pubkey={info.source} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Account</td>
        <td className="lg:text-right">
          <Address pubkey={info.account} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Wallet</td>
        <td className="lg:text-right">
          <Address pubkey={info.wallet} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Mint</td>
        <td className="lg:text-right">
          <Address pubkey={info.mint} alignRight link />
        </td>
      </tr>

      <tr>
        <td>System Program</td>
        <td className="lg:text-right">
          <Address pubkey={info.systemProgram} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Token Program</td>
        <td className="lg:text-right">
          <Address pubkey={info.tokenProgram} alignRight link />
        </td>
      </tr>
    </InstructionCardComponent>
  );
}
