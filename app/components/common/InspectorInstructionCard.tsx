import { Address } from '@components/common/Address';
import { useScrollAnchor } from '@providers/scroll-anchor';
import { ParsedInstruction, SignatureResult, TransactionInstruction, VersionedMessage } from '@solana/web3.js';
import getInstructionCardScrollAnchorId from '@utils/get-instruction-card-scroll-anchor-id';
import React from 'react';
import { Code } from 'react-feather';

import { BaseRawDetails } from './BaseRawDetails';
import { BaseRawParsedDetails } from './BaseRawParsedDetails';

type InstructionProps = {
  title: string;
  children?: React.ReactNode;
  result: SignatureResult;
  index: number;
  ix: TransactionInstruction | ParsedInstruction;
  defaultRaw?: boolean;
  innerCards?: React.JSX.Element[];
  childIndex?: number;
  // raw can be used to display raw instruction information
  // depends on whether the transaction was received from blockchain (TransactionInstruction)
  // or generated at the inspector (MessageCompiledInstruction)
  raw?: TransactionInstruction;
  // will be triggered on requesting raw data for instruction, if present
  onRequestRaw?: () => void;
  message: VersionedMessage;
};

export function InspectorInstructionCard({
  title,
  children,
  result,
  index,
  ix,
  defaultRaw,
  innerCards,
  childIndex,
  raw,
  onRequestRaw,
}: InstructionProps) {
  const [resultClass] = ixResult(result, index);
  const [showRaw, setShowRaw] = React.useState(defaultRaw || false);
  const rawClickHandler = () => {
    if (!defaultRaw && !showRaw && !raw) {
      // trigger handler to simulate behaviour for the InstructionCard for the transcation which contains logic in it to fetch raw transaction data
      onRequestRaw?.();
    }

    return setShowRaw(r => !r);
  };
  const scrollAnchorRef = useScrollAnchor(
    getInstructionCardScrollAnchorId(childIndex != null ? [index + 1, childIndex + 1] : [index + 1]),
  );

  return (
    <div className="bg-card rounded-lg border shadow-sm" ref={scrollAnchorRef}>
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h3 className="mb-0 flex items-center text-lg font-semibold">
          <span
            className={`mr-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              resultClass === 'success'
                ? 'bg-green-100 text-green-800'
                : resultClass === 'warning'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-800 text-white'
            }`}
          >
            #{index + 1}
            {childIndex !== undefined ? `.${childIndex + 1}` : ''}
          </span>
          {title}
        </h3>

        <button
          disabled={defaultRaw}
          className={`flex items-center rounded-md px-3 py-1.5 text-sm ${showRaw ? 'bg-gray-800 text-white' : 'border hover:bg-gray-100'}`}
          onClick={rawClickHandler}
        >
          <Code className="mr-2" size={13} /> Raw
        </button>
      </div>
      <div className="mb-0 overflow-x-auto">
        <table className="w-full text-sm">
          <tbody className="list">
            {showRaw ? (
              <>
                <tr>
                  <td>Program</td>
                  <td className="lg:text-right">
                    <Address pubkey={ix.programId} alignRight link />
                  </td>
                </tr>
                {'parsed' in ix ? (
                  <BaseRawParsedDetails ix={ix}>{raw ? <BaseRawDetails ix={raw} /> : null}</BaseRawParsedDetails>
                ) : (
                  <BaseRawDetails ix={raw || ix} />
                )}
              </>
            ) : (
              children
            )}
            {innerCards && innerCards.length > 0 && (
              <>
                <tr className="tablsep">
                  <td colSpan={3}>Inner Instructions</td>
                </tr>
                <tr>
                  <td colSpan={3}>
                    <div className="inner-cards">{innerCards}</div>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ixResult(result: SignatureResult, index: number) {
  if (result.err) {
    const err = result.err as any;
    const ixError = err['InstructionError'];
    if (ixError && Array.isArray(ixError)) {
      const [errorIndex, error] = ixError;
      if (Number.isInteger(errorIndex) && errorIndex === index) {
        return ['warning', `Error: ${JSON.stringify(error)}`];
      }
    }
    return ['dark'];
  }
  return ['success'];
}
