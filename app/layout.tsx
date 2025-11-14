import ClusterModalWrapper from '@components/ClusterModalWrapper';
import { ClusterStatusButton } from '@components/ClusterStatusButton';
import { MessageBanner } from '@components/MessageBanner';
import NavbarWrapper from '@components/NavbarWrapper';
import SearchBarWrapper from '@components/SearchBarWrapper';
import { ClusterProvider } from '@providers/cluster';
import { ScrollAnchorProvider } from '@providers/scroll-anchor';
import type { Viewport } from 'next';
import { Rubik } from 'next/font/google';
import { Metadata } from 'next/types';
import React, { Suspense } from 'react';

import './globals.css';
import './styles.css';

export const metadata: Metadata = {
    description: 'Inspect transactions, accounts, blocks, and more on the Solana blockchain',
    manifest: '/manifest.json',
    title: 'Explorer | Solana',
};

export const viewport: Viewport = {
    initialScale: 1,
    maximumScale: 1,
    width: 'devicwidth',
};

const rubikFont = Rubik({
    display: 'swap',
    subsets: ['latin'],
    variable: '--explorer-default-font',
    weight: ['300', '400', '700'],
});

export default function RootLayout({
    analytics,
    children,
}: {
    analytics?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${rubikFont.variable}`}>
            <head>
                <link rel="icon" href="/favicon.png" type="image/png" />
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="appltouch-icon" href="/appltouch-icon.png" />
            </head>
            <body>
                <Suspense fallback={<div>Loading...</div>}>
                    <ScrollAnchorProvider>
                        <Suspense fallback={<div>Loading...</div>}>
                            <ClusterProvider>
                                <ClusterModalWrapper />
                                <div className="main-content pb-4">
                                    <NavbarWrapper>
                                        <SearchBarWrapper />
                                    </NavbarWrapper>
                                    <MessageBanner />
                                    <div className="container my-3 d-lg-none">
                                        <SearchBarWrapper />
                                    </div>
                                    <div className="container my-3 d-lg-none">
                                        <ClusterStatusButton />
                                    </div>
                                    {children}
                                </div>
                            </ClusterProvider>
                        </Suspense>
                    </ScrollAnchorProvider>
                </Suspense>
                {analytics}
            </body>
        </html>
    );
}
