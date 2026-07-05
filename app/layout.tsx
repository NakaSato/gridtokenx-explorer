import { ClusterStatusButton } from '@/app/(core)/components/ClusterStatusButton';
import { MessageBanner } from '@/app/(core)/components/MessageBanner';
import NavbarWrapper from '@/app/(core)/components/NavbarWrapper';
import SearchBarWrapper from '@/app/(core)/components/SearchBarWrapper';
import { ClusterProvider } from '@/app/(core)/providers/cluster';
import { ScrollAnchorProvider } from '@/app/(core)/providers/scroll-anchor';
import { Toaster } from '@/app/(shared)/components/ui/sonner';
import type { Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Metadata } from 'next/types';
import React, { Suspense } from 'react';

import './globals.css';

// The runtime-config injection below must read the live container env on
// every request — never a value frozen into a prerendered shell at build.
export const dynamic = 'force-dynamic';

const defaultUrl = process.env.NEXT_PUBLIC_URL || 'https://explorer.solana.com';

/**
 * Values served to the browser as `window.__RUNTIME_CONFIG__` (see
 * app/(shared)/utils/runtime-config.ts). Plain (non-NEXT_PUBLIC) names are
 * read from the container env at request time; the NEXT_PUBLIC twins remain
 * as fallback so images built with the old bake still work.
 */
function runtimeEnv(): Record<string, string | undefined> {
  return {
    SOLANA_RPC_HTTP: process.env.SOLANA_RPC_HTTP ?? process.env.NEXT_PUBLIC_SOLANA_RPC_HTTP,
    SOLANA_RPC_WS: process.env.SOLANA_RPC_WS ?? process.env.NEXT_PUBLIC_SOLANA_RPC_WS,
    DEFAULT_CLUSTER: process.env.DEFAULT_CLUSTER ?? process.env.NEXT_PUBLIC_DEFAULT_CLUSTER,
    TRADING_PROGRAM_ID: process.env.TRADING_PROGRAM_ID ?? process.env.NEXT_PUBLIC_TRADING_PROGRAM_ID,
    TOKEN_PROGRAM_ID: process.env.TOKEN_PROGRAM_ID ?? process.env.NEXT_PUBLIC_TOKEN_PROGRAM_ID,
    GOVERNANCE_PROGRAM_ID: process.env.GOVERNANCE_PROGRAM_ID ?? process.env.NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID,
    ORACLE_PROGRAM_ID: process.env.ORACLE_PROGRAM_ID ?? process.env.NEXT_PUBLIC_ORACLE_PROGRAM_ID,
    REGISTRY_PROGRAM_ID: process.env.REGISTRY_PROGRAM_ID ?? process.env.NEXT_PUBLIC_REGISTRY_PROGRAM_ID,
    TREASURY_PROGRAM_ID: process.env.TREASURY_PROGRAM_ID ?? process.env.NEXT_PUBLIC_TREASURY_PROGRAM_ID,
    BLOCKBENCH_PROGRAM_ID: process.env.BLOCKBENCH_PROGRAM_ID ?? process.env.NEXT_PUBLIC_BLOCKBENCH_PROGRAM_ID,
  };
}

export const metadata: Metadata = {
  description: 'Inspect transactions, accounts, blocks, and more on the Solana blockchain',
  manifest: '/manifest.json',
  metadataBase: new URL(defaultUrl),
  title: 'Explorer | Solana',
};

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 1,
  width: 'device-width',
};

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  analytics,
  children,
}: {
  analytics?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Inline (not deferred) so it executes before any client chunk's
            module scope evaluates. `<` escaped to keep the JSON script-safe. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__RUNTIME_CONFIG__=${JSON.stringify(runtimeEnv()).replace(/</g, '\\u003c')}`,
          }}
        />
      </head>
      <body className="bg-navy-900" suppressHydrationWarning>
        <Suspense fallback={<div>Loading...</div>}>
          <ScrollAnchorProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <ClusterProvider>
                <div className="relative pb-12 sm:pb-16">
                  {/* Global Decorative Background */}
                  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
                    <div className="absolute bottom-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />
                  </div>

                  <div className="relative z-10">
                    <NavbarWrapper>
                      <SearchBarWrapper />
                    </NavbarWrapper>
                    <MessageBanner />
                    {children}
                  </div>
                </div>
              </ClusterProvider>
            </Suspense>
          </ScrollAnchorProvider>
        </Suspense>
        <Toaster position="bottom-right" richColors />
        {analytics}
      </body>
    </html>
  );
}
