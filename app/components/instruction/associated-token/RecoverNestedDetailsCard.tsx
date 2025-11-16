import { Address } from '@components/common/Address';
import { ParsedInstruction, SignatureResult } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { RecoverNestedInfo } from './types';

export function RecoverNestedDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: RecoverNestedInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
    InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
}) {
    const { ix, index, result, info, innerCards, childIndex, InstructionCardComponent = InstructionCard } = props;

    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            result={result}
            title="Associated Token Program: Recover Nested"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <tr>
                <td>Destination</td>
                <td className="lg:text-right">
                    <Address pubkey={info.destination} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Nested Mint</td>
                <td className="lg:text-right">
                    <Address pubkey={info.nestedMint} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Nested Owner</td>
                <td className="lg:text-right">
                    <Address pubkey={info.nestedOwner} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Nested Source</td>
                <td className="lg:text-right">
                    <Address pubkey={info.nestedSource} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Owner Mint</td>
                <td className="lg:text-right">
                    <Address pubkey={info.ownerMint} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Owner</td>
                <td className="lg:text-right">
                    <Address pubkey={info.wallet} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Token Program</td>
                <td className="lg:text-right">
                    <Address pubkey={info.tokenProgram} alignRight link />
                </td>
            </tr>
        </InstructionCardComponent>
    );
}
