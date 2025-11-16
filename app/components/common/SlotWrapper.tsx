'use client';

import React, { Suspense } from 'react';
import { Slot as SlotComponent } from './Slot';

export function Slot({ slot, link }: { slot: number | bigint; link?: boolean }) {
    return (
        <Suspense fallback={<span className="font-mono">{slot.toLocaleString('en-US')}</span>}>
            <SlotComponent slot={slot} link={link} />
        </Suspense>
    );
}
