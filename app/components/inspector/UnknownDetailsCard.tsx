import { TableCardBody } from '@components/common/TableCardBody';
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
        <div className="bg-card border rounded-lg shadow-sm" ref={scrollAnchorRef}>
            <div className={`card-header${!expanded ? ' border-bottom-none' : ''}`}>
                <h3 className="text-lg font-semibold mb-0 flex items-center">
                    <span className={`badge bg-info-soft m2`}>#{index + 1}</span>
                    {programName} Instruction
                </h3>

                <button
                    className={`btn btn-sm d-flex ${expanded ? 'btn-black active' : 'btn-white'}`}
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
