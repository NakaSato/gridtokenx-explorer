'use client';

import React, { Suspense } from 'react';
import { Navbar as NavbarComponent } from './Navbar';

export default function NavbarWrapper({ children }: { children?: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <nav className="border-b border-gray-200">
          <div className="w-full px-4 py-4 sm:px-6 lg:px-8">Loading...</div>
        </nav>
      }
    >
      <NavbarComponent>{children}</NavbarComponent>
    </Suspense>
  );
}
