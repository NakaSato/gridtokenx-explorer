import { AddressLookupTableProgram } from '@solana/web3.js';

import { Address } from '@/app/(shared)/components/common/Address';
import { Slot } from '@/app/(shared)/components/common/Slot';
import { InstructionCard } from '@/app/(shared)/components/instruction/InstructionCard';
import { InstructionDetailsProps } from '@/app/(shared)/components/transaction/InstructionsSection';

import { CreateLookupTableInfo } from './types';

export function CreateLookupTableDetailsCard(props: InstructionDetailsProps & { info: CreateLookupTableInfo }) {
  const { ix, index, result, innerCards, childIndex, info } = props;
  return (
    <InstructionCard
      ix={ix}
      index={index}
      result={result}
      title="Address Lookup Table: Create Lookup Table"
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
      <tr>
        <td>Payer Account</td>
        <td className="lg:text-right">
          <Address pubkey={info.payerAccount} alignRight link />
        </td>
      </tr>
      <tr>
        <td>Recent Slot</td>
        <td className="lg:text-right">
          <Slot slot={info.recentSlot} link />
        </td>
      </tr>
      <tr>
        <td>Bump Seed</td>
        <td className="lg:text-right">{info.bumpSeed}</td>
      </tr>
    </InstructionCard>
  );
}
