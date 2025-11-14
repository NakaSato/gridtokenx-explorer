'use client';

import React, { Suspense } from 'react';
import { Navbar as NavbarComponent } from './Navbar';

export default function NavbarWrapper({ children }: { children?: React.ReactNode }) {
    return (
        <Suspense fallback={<nav className="navbar navbar-expand-lg navbar-light"><div className="container px-4">Loading...</div></nav>}>
            <NavbarComponent>{children}</NavbarComponent>
        </Suspense>
    );
}
