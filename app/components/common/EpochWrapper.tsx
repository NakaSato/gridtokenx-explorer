'use client';

import React, { Suspense } from 'react';
import { Epoch as EpochComponent } from './Epoch';

export function Epoch({ epoch, link }: { epoch: number | bigint; link?: boolean }) {
    return (
        <Suspense fallback={<span className="font-monospace">{epoch.toLocaleString('en-US')}</span>}>
            <EpochComponent epoch={epoch} link={link} />
        </Suspense>
    );
}
