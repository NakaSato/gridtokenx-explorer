import { Address } from '@/app/(shared)/components/common/Address';
import { BPF_LOADER_PROGRAM_ID, ParsedInstruction, ParsedTransaction, SignatureResult } from '@solana/web3.js';
import { wrap } from '@/app/(shared)/utils/index';
import { ParsedInfo } from '@/app/validators/index';
import React from 'react';
import { create } from 'superstruct';

import { InstructionCard } from '../InstructionCard';
import { UnknownDetailsCard } from '../UnknownDetailsCard';
import { FinalizeInfo, WriteInfo } from './types';

type DetailsProps = {
  tx: ParsedTransaction;
  ix: ParsedInstruction;
  index: number;
  result: SignatureResult;
  innerCards?: JSX.Element[];
  childIndex?: number;
};

export function BpfLoaderDetailsCard(props: DetailsProps) {
  try {
    const parsed = create(props.ix.parsed, ParsedInfo);

    switch (parsed.type) {
      case 'write': {
        const info = create(parsed.info, WriteInfo);
        return <BpfLoaderWriteDetailsCard info={info} {...props} />;
      }
      case 'finalize': {
        const info = create(parsed.info, FinalizeInfo);
        return <BpfLoaderFinalizeDetailsCard info={info} {...props} />;
      }
      default:
        return <UnknownDetailsCard {...props} />;
    }
  } catch (error) {
    console.error(error, {
      signature: props.tx.signatures[0],
    });
    return <UnknownDetailsCard {...props} />;
  }
}

type Props<T> = {
  ix: ParsedInstruction;
  index: number;
  result: SignatureResult;
  info: T;
  innerCards?: JSX.Element[];
  childIndex?: number;
};

export function BpfLoaderWriteDetailsCard(props: Props<WriteInfo>) {
  const { ix, index, result, info, innerCards, childIndex } = props;
  const bytes = wrap(info.bytes, 50);
  return (
    <InstructionCard
      ix={ix}
      index={index}
      result={result}
      title="BPF Loader 2: Write"
      innerCards={innerCards}
      childIndex={childIndex}
    >
      <tr>
        <td>Program</td>
        <td className="lg:text-right">
          <Address pubkey={BPF_LOADER_PROGRAM_ID} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Account</td>
        <td className="lg:text-right">
          <Address pubkey={info.account} alignRight link />
        </td>
      </tr>

      <tr>
        <td>
          Bytes <span className="text-muted-foreground">(Base 64)</span>
        </td>
        <td className="lg:text-right">
          <pre className="d-inlinblock mb-0 text-start">{bytes}</pre>
        </td>
      </tr>

      <tr>
        <td>Offset</td>
        <td className="lg:text-right">{info.offset}</td>
      </tr>
    </InstructionCard>
  );
}

export function BpfLoaderFinalizeDetailsCard(props: Props<FinalizeInfo>) {
  const { ix, index, result, info, innerCards, childIndex } = props;

  return (
    <InstructionCard
      ix={ix}
      index={index}
      result={result}
      title="BPF Loader 2: Finalize"
      innerCards={innerCards}
      childIndex={childIndex}
    >
      <tr>
        <td>Program</td>
        <td className="lg:text-right">
          <Address pubkey={BPF_LOADER_PROGRAM_ID} alignRight link />
        </td>
      </tr>

      <tr>
        <td>Account</td>
        <td className="lg:text-right">
          <Address pubkey={info.account} alignRight link />
        </td>
      </tr>
    </InstructionCard>
  );
}
