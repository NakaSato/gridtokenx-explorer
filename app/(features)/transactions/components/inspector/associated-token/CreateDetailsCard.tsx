import { Address } from '@/app/(shared)/components/Address';
import { InspectorInstructionCard } from '@/app/(shared)/components/InspectorInstructionCard';
import { ParsedInstruction, SignatureResult, TransactionInstruction, VersionedMessage } from '@solana/web3.js';
import React from 'react';

type JSXElement = React.ReactElement;

import { AddressWithContext } from '../AddressWithContext';

export function CreateDetailsCard({
  childIndex,
  index,
  innerCards,
  ix,
  message,
  raw,
  result,
  InstructionCardComponent = InspectorInstructionCard,
}: {
  childIndex?: number;
  index: number;
  innerCards?: React.ReactElement[];
  ix: ParsedInstruction;
  message: VersionedMessage;
  raw: TransactionInstruction;
  result: SignatureResult;
  InstructionCardComponent?: React.FC<Parameters<typeof InspectorInstructionCard>[0]>;
}) {
  return (
    <InstructionCardComponent
      ix={ix}
      index={index}
      message={message}
      raw={raw}
      result={result}
      title="Associated Token Program: Create"
      innerCards={innerCards}
      childIndex={childIndex}
    >
      <tr>
        <td>Program</td>
        <td className="lg:text-right">
          <Address pubkey={ix.programId} alignRight link />
        </td>
      </tr>
      <tr>
        <td>Source</td>
        <td className="lg:text-right">
          <AddressWithContext pubkey={raw.keys[0].pubkey} hideInfo />
        </td>
      </tr>
      <tr>
        <td>Account</td>
        <td className="lg:text-right">
          <AddressWithContext pubkey={raw.keys[1].pubkey} hideInfo />
        </td>
      </tr>
      <tr>
        <td>Mint</td>
        <td className="lg:text-right">
          <AddressWithContext pubkey={raw.keys[3].pubkey} hideInfo />
        </td>
      </tr>
      <tr>
        <td>Wallet</td>
        <td className="lg:text-right">
          <AddressWithContext pubkey={raw.keys[2].pubkey} hideInfo />
        </td>
      </tr>
      <tr>
        <td>System Program</td>
        <td className="lg:text-right">
          <AddressWithContext pubkey={raw.keys[4].pubkey} hideInfo />
        </td>
      </tr>
      <tr>
        <td>Token Program</td>
        <td className="lg:text-right">
          <AddressWithContext pubkey={raw.keys[5].pubkey} hideInfo />
        </td>
      </tr>
    </InstructionCardComponent>
  );
}
