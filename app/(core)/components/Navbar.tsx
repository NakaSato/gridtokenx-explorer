'use client';

import Logo from '@/app/(shared)/img/logos-solana/dark-explorer-logo.svg';
import { useDisclosure } from '@mantine/hooks';
import { useClusterPath } from '@/app/(shared)/utils/url';
import Image from 'next/image';
import Link from 'next/link';
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from 'next/navigation';
import React, { ReactNode } from 'react';

import { ClusterStatusButton } from './ClusterStatusButton';
import { CommandPalette } from './CommandPalette';

export interface INavbarProps {
  children?: ReactNode;
}

export function Navbar({ children }: INavbarProps) {
  const [navOpened, navHandlers] = useDisclosure(false);
  const homePath = useClusterPath({ pathname: '/' });
  const featureGatesPath = useClusterPath({ pathname: '/feature-gates' });
  const supplyPath = useClusterPath({ pathname: '/supply' });
  const inspectorPath = useClusterPath({ pathname: '/tx/inspector' });
  const transactionsPath = useClusterPath({ pathname: '/tx' });
  const tradingPath = useClusterPath({ pathname: '/trading' });
  const energyTokenPath = useClusterPath({ pathname: '/energy-token' });
  const governancePath = useClusterPath({ pathname: '/governance' });
  const oraclePath = useClusterPath({ pathname: '/oracle' });
  const registryPath = useClusterPath({ pathname: '/registry' });
  const treasuryPath = useClusterPath({ pathname: '/treasury' });
  const anchorPublicKeysPath = useClusterPath({ pathname: '/anchor-public-keys' });
  const selectedLayoutSegment = useSelectedLayoutSegment();
  const selectedLayoutSegments = useSelectedLayoutSegments();
  return (
    <nav 
      className="sticky top-0 z-50 w-full border-b border-border bg-background/80 shadow-sm backdrop-blur-md"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={homePath} className="flex-shrink-0 transition-opacity hover:opacity-90" aria-label="Solana Explorer Home">
              <Image
                alt="Solana Explorer"
                height={22}
                src={Logo}
                width={214}
                priority
                className="h-5 w-auto sm:h-6 md:h-7"
              />
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile, visible on lg+ */}
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-between lg:gap-8">
           
            {/* Navigation Links */}
            <ul className="flex items-center space-x-1" role="menubar">
              <li>
                <Link
                  href={tradingPath}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'trading'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  role="menuitem"
                >
                  Trading
                </Link>
              </li>
              <li>
                <Link
                  href={energyTokenPath}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'energy-token'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  role="menuitem"
                >
                  Energy Token
                </Link>
              </li>
              <li>
                <Link
                  href={governancePath}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'governance'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  role="menuitem"
                >
                  Governance
                </Link>
              </li>
              <li>
                <Link
                  href={oraclePath}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'oracle'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  role="menuitem"
                >
                  Oracle
                </Link>
              </li>
              <li>
                <Link
                  href={registryPath}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'registry'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  role="menuitem"
                >
                  Registry
                </Link>
              </li>
              <li>
                <Link
                  href={treasuryPath}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'treasury'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  role="menuitem"
                >
                  Treasury
                </Link>
              </li>
            </ul>
            
            <div className="flex flex-1 items-center justify-end gap-4">
              <div className="w-full max-w-md">
                <CommandPalette />
              </div>
              <ClusterStatusButton />
            </div>
          </div>

          {/* Mobile Controls - Visible on mobile/tablet, hidden on desktop */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
            {/* Cluster Status - Mobile */}
            <div className="flex items-center">
              <ClusterStatusButton />
            </div>

            {/* Mobile menu button */}
            <button
              className="focus:ring-primary inline-flex h-10 w-10 items-center justify-center rounded-lg p-2 text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-95"
              type="button"
              onClick={navHandlers.toggle}
              aria-expanded={navOpened}
              aria-label="Toggle navigation menu"
              aria-controls="mobile-menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {navOpened ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Enhanced with animations */}
        <div
          id="mobile-menu"
          className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
            navOpened ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'
          }`}
          aria-hidden={!navOpened}
        >
          <div className="transform border-t border-border bg-background/95 backdrop-blur-sm transition-transform duration-300">
            <div className="px-2 py-2 sm:px-3 sm:py-3">
              {/* Mobile Search - If children provided */}
              {children && <div className="mb-3">{children}</div>}
              
              {/* Mobile Navigation Links */}
              <nav className="space-y-1" role="menu">
                <Link
                  href={tradingPath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'trading'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Trading
                </Link>
                <Link
                  href={energyTokenPath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'energy-token'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Energy Token
                </Link>
                <Link
                  href={governancePath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'governance'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Governance
                </Link>
                <Link
                  href={oraclePath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'oracle'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Oracle
                </Link>
                <Link
                  href={registryPath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'registry'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Registry
                </Link>
                <Link
                  href={treasuryPath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'treasury'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Treasury
                </Link>
                <Link
                  href={transactionsPath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'txs'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Transactions
                </Link>

                <Link
                  href={tradingPath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'trading'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Trading
                </Link>

                <Link
                  href={governancePath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'governance'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Governance
                </Link>

                <Link
                  href={oraclePath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'oracle'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Oracle
                </Link>

                <Link
                  href={registryPath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'registry'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Registry
                </Link>
                
                <Link
                  href={supplyPath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'supply'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Supply
                </Link>
                

                
                <Link
                  href={featureGatesPath}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    selectedLayoutSegment === 'feature-gates'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={navHandlers.close}
                  role="menuitem"
                >
                  Feature Gates
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
