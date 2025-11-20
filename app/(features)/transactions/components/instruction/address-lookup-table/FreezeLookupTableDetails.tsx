import { AddressLookupTableProgram, ParsedInstruction, ParsedTransaction, SignatureResult } from '@solana/web3.js';

import { Address } from '@/app/(shared)/components/common/Address';
import { InstructionCard } from '../InstructionCard';

import { FreezeLookupTableInfo } from './types';

type DetailsProps = {
  ix: ParsedInstruction;
  index: number;
  result: SignatureResult;
  tx: ParsedTransaction;
  innerCards?: React.ReactElement[];
  childIndex?: number;
};

export function FreezeLookupTableDetailsCard(props: DetailsProps & { info: FreezeLookupTableInfo }) {
  const { ix, index, result, innerCards, childIndex, info } = props;
  return (
    <InstructionCard
      ix={ix}
      index={index}
      result={result}
      title="Address Lookup Table: Freeze Lookup Table"
      innerCards={innerCards}
      childIndex={childIndex}
    >
      <tr>
        <td>Program</td>
        <td className="lg:text-right">
          <Address pubkey={AddressLookupTableProgram.programId} alignRight link />
        </td>
      </tr>
      <tr>
        <td>Lookup Table</td>
        <td className="lg:text-right">
          <Address pubkey={info.lookupTableAccount} alignRight link />
        </td>
      </tr>
      <tr>
        <td>Lookup Table Authority</td>
        <td className="lg:text-right">
          <Address pubkey={info.lookupTableAuthority} alignRight link />
        </td>
      </tr>
    </InstructionCard>
  );
}
