import { Address } from '@/app/(shared)/components/Address';
import { Signature } from '@/app/(shared)/components/Signature';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import bs58 from 'bs58';
import React from 'react';
import * as nacl from 'tweetnacl';

export function TransactionSignatures({
  signatures,
  message,
  rawMessage,
}: {
  signatures: (string | null)[];
  message: VersionedMessage;
  rawMessage: Uint8Array;
}) {
  const signatureRows = React.useMemo(() => {
    return signatures.map((signature, index) => {
      const publicKey = message.staticAccountKeys[index];

      let verified;
      if (signature) {
        const key = publicKey.toBytes();
        const rawSignature = bs58.decode(signature);
        verified = verifySignature({
          key,
          message: rawMessage,
          signature: rawSignature,
        });
      }

      const props = {
        index,
        signature,
        signer: publicKey,
        verified,
      };

      return <SignatureRow key={publicKey.toBase58()} {...props} />;
    });
  }, [signatures, message, rawMessage]);

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Signatures</h3>
      </div>
      <div className="mb-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-muted-foreground">#</th>
              <th className="text-muted-foreground">Signature</th>
              <th className="text-muted-foreground">Signer</th>
              <th className="text-muted-foreground">Validity</th>
              <th className="text-muted-foreground">Details</th>
            </tr>
          </thead>
          <tbody className="list">{signatureRows}</tbody>
        </table>
      </div>
    </div>
  );
}

function verifySignature({
  message,
  signature,
  key,
}: {
  message: Uint8Array;
  signature: Uint8Array;
  key: Uint8Array;
}): boolean {
  return nacl.sign.detached.verify(message, signature, key);
}

function SignatureRow({
  signature,
  signer,
  verified,
  index,
}: {
  signature: string | null;
  signer: PublicKey;
  verified?: boolean;
  index: number;
}) {
  return (
    <tr>
      <td>
        <span className="mr-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
          {index + 1}
        </span>
      </td>
      <td>{signature ? <Signature signature={signature} truncateChars={40} /> : 'Missing Signature'}</td>
      <td>
        <Address pubkey={signer} link />
      </td>
      <td>
        {verified === undefined ? (
          'N/A'
        ) : verified ? (
          <span className="mr-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            Valid
          </span>
        ) : (
          <span className="mr-1 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            Invalid
          </span>
        )}
      </td>
      <td>
        {index === 0 && (
          <span className="mr-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
            Fee Payer
          </span>
        )}
      </td>
    </tr>
  );
}
