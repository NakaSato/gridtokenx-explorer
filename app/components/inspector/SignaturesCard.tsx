import { Address } from '@components/common/Address';
import { Signature } from '@components/common/Signature';
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
        <div className="bg-card border rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Signatures</h3>
            </div>
            <div className="overflow-x-auto mb-0">
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
                <span className="badge bg-info-soft m1">{index + 1}</span>
            </td>
            <td>{signature ? <Signature signature={signature} truncateChars={40} /> : 'Missing Signature'}</td>
            <td>
                <Address pubkey={signer} link />
            </td>
            <td>
                {verified === undefined ? (
                    'N/A'
                ) : verified ? (
                    <span className="badge bg-success-soft m1">Valid</span>
                ) : (
                    <span className="badge bg-warning-soft m1">Invalid</span>
                )}
            </td>
            <td>{index === 0 && <span className="badge bg-info-soft m1">Fee Payer</span>}</td>
        </tr>
    );
}
