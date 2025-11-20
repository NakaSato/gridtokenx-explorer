import { Address } from '@/app/(shared)/components/common/Address';
import { TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { HexData } from './HexData';

/**
 *  Component that displays accounts from any Instruction.
 *
 *  VersionedMessage is optional as it will be present at inspector page only.
 */
export function BaseRawDetails({ ix }: { ix: TransactionInstruction }) {
  return <BaseTransactionInstructionRawDetails ix={ix} />;
}

function BaseTransactionInstructionRawDetails({ ix }: { ix: TransactionInstruction }) {
  return (
    <>
      {ix.keys.map(({ pubkey, isSigner, isWritable }, keyIndex) => (
        <tr key={keyIndex}>
          <td>
            <div className="d-md-inline mr-2">Account #{keyIndex + 1}</div>
            {isWritable && (
              <span className="mr-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                Writable
              </span>
            )}
            {isSigner && (
              <span className="mr-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                Signer
              </span>
            )}
          </td>
          <td className="lg:text-right">
            <Address pubkey={pubkey} alignRight link />
          </td>
        </tr>
      ))}

      <tr>
        <td>
          Instruction Data <span className="text-muted-foreground">(Hex)</span>
        </td>
        <td className="lg:text-right">
          <HexData raw={ix.data} />
        </td>
      </tr>
    </>
  );
}
