import { ParsedInstruction } from '@solana/web3.js';
import React from 'react';

export function BaseRawParsedDetails({ ix, children }: { ix: ParsedInstruction; children?: React.ReactNode }) {
    return (
        <>
            {children}

            <tr>
                <td>
                    Instruction Data <span className="text-muted-foreground">(JSON)</span>
                </td>
                <td className="lg:text-right">
                    <pre className="d-inlinblock text-start json-wrap">{JSON.stringify(ix.parsed, null, 2)}</pre>
                </td>
            </tr>
        </>
    );
}
