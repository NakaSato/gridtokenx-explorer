'use client';

import React, { Suspense } from 'react';
import { ClusterModal as ClusterModalComponent } from './ClusterModal';

export default function ClusterModalWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClusterModalComponent />
    </Suspense>
  );
}
