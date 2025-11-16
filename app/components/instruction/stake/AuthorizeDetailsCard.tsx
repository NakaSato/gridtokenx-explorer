import { Address } from '@components/common/Address';
import { ParsedInstruction, SignatureResult, StakeProgram } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { AuthorizeInfo } from './types';

export function AuthorizeDetailsCard(props: {
  ix: ParsedInstruction;
  index: number;
  result: SignatureResult;
  info: AuthorizeInfo;
  innerCards?: JSX.Element[];
  childIndex?: number;
}) {
  const { ix, index, result, info, innerCards, childIndex } = props;

  return (
    <InstructionCard
      ix={ix}
      index={index}
      result={result}
      title="Stake Program: Authorize"
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
        <td>Old Authority Address</td>
        <td className="lg:text-right">
          <Address pubkey={info.authority} alignRight link />
        </td>
      </tr>

      <tr>
        <td>New Authority Address</td>
        <td className="lg:text-right">
          <Address pubkey={info.newAuthority} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Authority Type</td>
        <td className="lg:text-right">{info.authorityType}</td>
      </tr>
    </InstructionCard>
  );
}
