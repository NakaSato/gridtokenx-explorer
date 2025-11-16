import { Address } from '@components/common/Address';
import { Copyable } from '@components/common/Copyable';
import { SolBalance } from '@components/common/SolBalance';
import { ParsedInstruction, SignatureResult, SystemProgram } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { CreateAccountWithSeedInfo } from './types';

export function CreateWithSeedDetailsCard(props: {
  ix: ParsedInstruction;
  index: number;
  result: SignatureResult;
  info: CreateAccountWithSeedInfo;
  innerCards?: JSX.Element[];
  childIndex?: number;
}) {
  const { ix, index, result, info, innerCards, childIndex } = props;

  return (
    <InstructionCard
      ix={ix}
      index={index}
      result={result}
      title="System Program: Create Account w/ Seed"
      innerCards={innerCards}
      childIndex={childIndex}
    >
      <tr>
        <td>Program</td>
        <td className="lg:text-right">
          <Address pubkey={SystemProgram.programId} alignRight link />
        </td>
      </tr>

      <tr>
        <td>From Address</td>
        <td className="lg:text-right">
          <Address pubkey={info.source} alignRight link />
        </td>
      </tr>

      <tr>
        <td>New Address</td>
        <td className="lg:text-right">
          <Address pubkey={info.newAccount} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Base Address</td>
        <td className="lg:text-right">
          <Address pubkey={info.base} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Seed</td>
        <td className="lg:text-right">
          <Copyable text={info.seed}>
            <code>{info.seed}</code>
          </Copyable>
        </td>
      </tr>

      <tr>
        <td>Transfer Amount (SOL)</td>
        <td className="lg:text-right">
          <SolBalance lamports={info.lamports} />
        </td>
      </tr>

      <tr>
        <td>Allocated Data Size</td>
        <td className="lg:text-right">{info.space} byte(s)</td>
      </tr>

      <tr>
        <td>Assigned Program Id</td>
        <td className="lg:text-right">
          <Address pubkey={info.owner} alignRight link />
        </td>
      </tr>
    </InstructionCard>
  );
}
