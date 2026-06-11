import { Buffer } from 'buffer';
import React, { ReactNode } from 'react';

import { Copyable } from '@/app/(shared)/components/Copyable';

function HexDataContent({ hexString, divs }: { hexString: string; divs: ReactNode[] }) {
  return (
    <Copyable text={hexString}>
      <pre className="d-inlinblock mb-0 text-start">{divs}</pre>
    </Copyable>
  );
}

export function HexData({ raw }: { raw: Buffer }) {
  if (!raw || raw.length === 0) {
    return <span>No data</span>;
  }

  const chunks = [];
  const hexString = raw.toString('hex');
  for (let i = 0; i < hexString.length; i += 2) {
    chunks.push(hexString.slice(i, i + 2));
  }

  const SPAN_SIZE = 4;
  const ROW_SIZE = 4 * SPAN_SIZE;

  const divs: ReactNode[] = [];
  let spans: ReactNode[] = [];
  for (let i = 0; i < chunks.length; i += SPAN_SIZE) {
    const color = i % (2 * SPAN_SIZE) === 0 ? 'text-white' : 'text-gray-500';
    spans.push(
      <span key={i} className={color}>
        {chunks.slice(i, i + SPAN_SIZE).join(' ')}&emsp;
      </span>,
    );

    if (i % ROW_SIZE === ROW_SIZE - SPAN_SIZE || i >= chunks.length - SPAN_SIZE) {
      divs.push(<div key={i / ROW_SIZE}>{spans}</div>);

      // clear spans
      spans = [];
    }
  }

  return (
    <>
      <div className="hidden items-center justify-end lg:flex">
        <HexDataContent hexString={hexString} divs={divs} />
      </div>
      <div className="flex items-center lg:hidden">
        <HexDataContent hexString={hexString} divs={divs} />
      </div>
    </>
  );
}
