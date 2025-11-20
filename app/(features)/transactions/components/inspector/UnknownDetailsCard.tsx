import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { useScrollAnchor } from '@providers/scroll-anchor';
import { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import getInstructionCardScrollAnchorId from '@/app/utils/get-instruction-card-scroll-anchor-id';

import { BaseRawDetails } from '../common/BaseRawDetails';
import { AddressWithContext, programValidator } from './AddressWithContext';

export function UnknownDetailsCard({
  index,
  ix,
  programName,
}: {
  index: number;
  ix: TransactionInstruction;
  programName: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const scrollAnchorRef = useScrollAnchor(getInstructionCardScrollAnchorId([index + 1]));

  return (
    <div className="bg-card rounded-lg border shadow-sm" ref={scrollAnchorRef}>
      <div className={`card-header${!expanded ? 'border-bottom-none' : ''}`}>
        <h3 className="mb-0 flex items-center text-lg font-semibold">
          <span className="mr-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
            #{index + 1}
          </span>
          {programName} Instruction
        </h3>

        <button
          className={`flex items-center rounded-md px-3 py-1.5 text-sm ${expanded ? 'bg-gray-800 text-white' : 'border hover:bg-gray-100'}`}
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {expanded && (
        <TableCardBody>
          <tr>
            <td>Program</td>
            <td className="lg:text-right">
              <AddressWithContext pubkey={ix.programId} validator={programValidator} />
            </td>
          </tr>
          <BaseRawDetails ix={ix} />
        </TableCardBody>
      )}
    </div>
  );
}
