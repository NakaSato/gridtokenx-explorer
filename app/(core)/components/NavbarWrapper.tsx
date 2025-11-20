'use client';

import React, { Suspense } from 'react';
import { Navbar as NavbarComponent } from './Navbar';

export default function NavbarWrapper({ children }: { children?: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <nav className="border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">Loading...</div>
        </nav>
      }
    >
      <NavbarComponent>{children}</NavbarComponent>
    </Suspense>
  );
}
