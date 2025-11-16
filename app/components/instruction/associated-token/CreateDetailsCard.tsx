import { Address } from '@components/common/Address';
import { ParsedInstruction, PublicKey, SignatureResult } from '@solana/web3.js';
import { addressToPublicKey, toAddress } from '@utils/rpc';
import React from 'react';

import { InstructionCard } from '../InstructionCard';

export function CreateDetailsCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
    InstructionCardComponent = InstructionCard,
}: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
    InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
}) {
    const info = ix.parsed.info;
    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
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
                    <Address pubkey={addressToPublicKey(toAddress(info.source))} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Account</td>
                <td className="lg:text-right">
                    <Address pubkey={addressToPublicKey(toAddress(info.account))} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Mint</td>
                <td className="lg:text-right">
                    <Address pubkey={addressToPublicKey(toAddress(info.mint))} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Wallet</td>
                <td className="lg:text-right">
                    <Address pubkey={addressToPublicKey(toAddress(info.wallet))} alignRight link />
                </td>
            </tr>

            <tr>
                <td>System Program</td>
                <td className="lg:text-right">
                    <Address pubkey={addressToPublicKey(toAddress(info.systemProgram))} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Token Program</td>
                <td className="lg:text-right">
                    <Address pubkey={addressToPublicKey(toAddress(info.tokenProgram))} alignRight link />
                </td>
            </tr>
        </InstructionCardComponent>
    );
}
