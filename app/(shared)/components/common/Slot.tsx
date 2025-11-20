import { useClusterPath } from '@/app/(shared)/utils/url';
import Link from 'next/link';
import React from 'react';

import { Copyable } from '@/app/(shared)/components/Copyable';

type Props = {
  slot: number | bigint;
  link?: boolean;
};
export function Slot({ slot, link }: Props) {
  const slotPath = useClusterPath({ pathname: `/block/${slot}` });
  return (
    <span className="font-mono">
      {link ? (
        <Copyable text={slot.toString()}>
          <Link href={slotPath}>{slot.toLocaleString('en-US')}</Link>
        </Copyable>
      ) : (
        slot.toLocaleString('en-US')
      )}
    </span>
  );
}
