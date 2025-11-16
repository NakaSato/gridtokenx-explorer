'use client';

import Logo from '@img/logos-solana/dark-explorer-logo.svg';
import { useDisclosure } from '@mantine/hooks';
import { useClusterPath } from '@utils/url';
import Image from 'next/image';
import Link from 'next/link';
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from 'next/navigation';
import React, { ReactNode } from 'react';

import { ClusterStatusButton } from './ClusterStatusButton';

export interface INavbarProps {
  children?: ReactNode;
}

export function Navbar({ children }: INavbarProps) {
  const [navOpened, navHandlers] = useDisclosure(false);
  const homePath = useClusterPath({ pathname: '/' });
  const featureGatesPath = useClusterPath({ pathname: '/feature-gates' });
  const supplyPath = useClusterPath({ pathname: '/supply' });
  const inspectorPath = useClusterPath({ pathname: '/tx/inspector' });
  const transactionsPath = useClusterPath({ pathname: '/transactions' });
  const anchorPublicKeysPath = useClusterPath({ pathname: '/anchor-public-keys' });
  const selectedLayoutSegment = useSelectedLayoutSegment();
  const selectedLayoutSegments = useSelectedLayoutSegments();
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 shadow-sm backdrop-blur-md dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={homePath} className="flex-shrink-0 transition-opacity hover:opacity-80">
              <Image 
                alt="Solana Explorer" 
                height={22} 
                src={Logo} 
                width={214} 
                priority 
                className="h-5 w-auto sm:h-6 md:h-7 lg:h-[22px]"
              />
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on mobile, visible on lg+ */}
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-between lg:gap-8">
            {/* Children (Search bar, etc.) - Desktop only */}
            <div className="flex-1 max-w-md">
              {children}
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              <ul className="flex items-center space-x-1">
                <li>
                  <Link
                    className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedLayoutSegment === 'transactions'
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                    href={transactionsPath}
                  >
                    <span className="hidden sm:inline">Transactions</span>
                    <span className="sm:hidden">TX</span>
                    {selectedLayoutSegment === 'transactions' && (
                      <span className="bg-primary absolute inset-x-0 bottom-0 h-0.5 rounded-t-full"></span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedLayoutSegment === 'anchor-public-keys'
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                    href={anchorPublicKeysPath}
                  >
                    <span className="hidden sm:inline">Anchor Keys</span>
                    <span className="sm:hidden">Keys</span>
                    {selectedLayoutSegment === 'anchor-public-keys' && (
                      <span className="bg-primary absolute inset-x-0 bottom-0 h-0.5 rounded-t-full"></span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedLayoutSegment === 'feature-gates'
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                    href={featureGatesPath}
                  >
                    <span className="hidden sm:inline">Feature Gates</span>
                    <span className="sm:hidden">Gates</span>
                    {selectedLayoutSegment === 'feature-gates' && (
                      <span className="bg-primary absolute inset-x-0 bottom-0 h-0.5 rounded-t-full"></span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedLayoutSegment === 'supply'
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                    href={supplyPath}
                  >
                    Supply
                    {selectedLayoutSegment === 'supply' && (
                      <span className="bg-primary absolute inset-x-0 bottom-0 h-0.5 rounded-t-full"></span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedLayoutSegments[0] === 'tx' && selectedLayoutSegments[1] === '(inspector)'
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                    href={inspectorPath}
                  >
                    Inspector
                    {selectedLayoutSegments[0] === 'tx' && selectedLayoutSegments[1] === '(inspector)' && (
                      <span className="bg-primary absolute inset-x-0 bottom-0 h-0.5 rounded-t-full"></span>
                    )}
                  </Link>
                </li>
              </ul>

              <div className="ml-4 flex items-center gap-2 border-l border-gray-200 pl-4 dark:border-gray-700">
                <ClusterStatusButton />
              </div>
            </div>
          </div>

          {/* Mobile Controls - Visible on mobile/tablet, hidden on desktop */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Cluster Status - Mobile */}
            <div className="flex items-center">
              <ClusterStatusButton />
            </div>
            
            {/* Mobile menu button */}
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg p-2 text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none active:scale-95 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
              type="button"
              onClick={navHandlers.toggle}
              aria-expanded={navOpened}
              aria-label="Toggle navigation menu"
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
          className={`overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
            navOpened ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="px-3 py-3">
              {/* Mobile Search - If children provided */}
              {children && (
                <div className="mb-4">
                  {children}
                </div>
              )}
              
              <ul className="space-y-1">
                <li>
                  <Link
                    className={`flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 ${
                      selectedLayoutSegment === 'transactions'
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                    href={transactionsPath}
                    onClick={navHandlers.close}
                  >
                    <span>Transactions</span>
                    {selectedLayoutSegment === 'transactions' && (
                      <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 ${
                      selectedLayoutSegment === 'anchor-public-keys'
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                    href={anchorPublicKeysPath}
                    onClick={navHandlers.close}
                  >
                    <span>Anchor Keys</span>
                    {selectedLayoutSegment === 'anchor-public-keys' && (
                      <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 ${
                      selectedLayoutSegment === 'feature-gates'
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                    href={featureGatesPath}
                    onClick={navHandlers.close}
                  >
                    <span>Feature Gates</span>
                    {selectedLayoutSegment === 'feature-gates' && (
                      <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 ${
                      selectedLayoutSegment === 'supply'
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                    href={supplyPath}
                    onClick={navHandlers.close}
                  >
                    <span>Supply</span>
                    {selectedLayoutSegment === 'supply' && (
                      <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    className={`flex items-center justify-between rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 ${
                      selectedLayoutSegments[0] === 'tx' && selectedLayoutSegments[1] === '(inspector)'
                        ? 'text-primary bg-primary/10 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                    }`}
                    href={inspectorPath}
                    onClick={navHandlers.close}
                  >
                    <span>Inspector</span>
                    {selectedLayoutSegments[0] === 'tx' && selectedLayoutSegments[1] === '(inspector)' && (
                      <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
