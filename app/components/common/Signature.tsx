import { TransactionSignature } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React from 'react';

import { Copyable } from './Copyable';

type Props = {
  signature: TransactionSignature;
  alignRight?: boolean;
  link?: boolean;
  truncate?: boolean;
  truncateChars?: number;
};

export function Signature({ signature, alignRight, link, truncate, truncateChars }: Props) {
  let signatureLabel = signature;

  if (truncateChars) {
    signatureLabel = signature.slice(0, truncateChars) + '…';
  }
  const transactionPath = useClusterPath({ pathname: `/tx/${signature}` });
  return (
    <div className={`flex items-center ${alignRight ? 'justify-end' : ''}`}>
      <Copyable text={signature} replaceText={!alignRight}>
        <span className="font-mono">
          {link ? (
            <Link className={truncate ? 'text-truncate signaturtruncate' : ''} href={transactionPath}>
              {signatureLabel}
            </Link>
          ) : (
            signatureLabel
          )}
        </span>
      </Copyable>
    </div>
  );
}
