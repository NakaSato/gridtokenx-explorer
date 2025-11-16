'use client';

import Logo from '@img/logos-solana/dark-explorer-logo.svg';
import { useDisclosure } from '@mantine/hooks';
import { useClusterPath } from '@utils/url';
import Image from 'next/image';
import Link from 'next/link';
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from 'next/navigation';
import React, { ReactNode } from 'react';

import { ClusterStatusButton } from './ClusterStatusButton';
import { ThemeToggle } from './ThemeToggle';

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
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md dark:border-gray-700 dark:bg-gray-900/80">
            <div className="container mx-auto px-4 lg:px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href={homePath} className="flex-shrink-0 transition-opacity hover:opacity-80">
                        <Image alt="Solana Explorer" height={22} src={Logo} width={214} priority />
                    </Link>

                    {/* Mobile menu button */}
                    <button
                        className="focus:ring-primary inline-flex items-center justify-center rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:outline-none focus:ring-inset lg:hidden dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                        type="button"
                        onClick={navHandlers.toggle}
                        aria-expanded={navOpened}
                        aria-label="Toggle navigation menu"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {navOpened ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>

                    {/* Children (Search bar, etc.) */}
                    <div className="navbar-children mx-6 hidden flex-grow items-center lg:flex">{children}</div>

                    {/* Desktop Navigation */}
                    <div className="hidden items-center space-x-1 lg:flex">
                        <ul className="flex items-center space-x-1">
                            <li>
                                <Link
                                    className={`relative rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                                        selectedLayoutSegment === 'transactions'
                                            ? 'text-primary bg-primary/10'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                                    }`}
                                    href={transactionsPath}
                                >
                                    Transactions
                                    {selectedLayoutSegment === 'transactions' && (
                                        <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full"></span>
                                    )}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className={`relative rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                                        selectedLayoutSegment === 'anchor-public-keys'
                                            ? 'text-primary bg-primary/10'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                                    }`}
                                    href={anchorPublicKeysPath}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                            />
                                        </svg>
                                        Anchor Keys
                                    </span>
                                    {selectedLayoutSegment === 'anchor-public-keys' && (
                                        <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full"></span>
                                    )}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className={`relative rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                                        selectedLayoutSegment === 'feature-gates'
                                            ? 'text-primary bg-primary/10'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                                    }`}
                                    href={featureGatesPath}
                                >
                                    Feature Gates
                                    {selectedLayoutSegment === 'feature-gates' && (
                                        <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full"></span>
                                    )}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className={`relative rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                                        selectedLayoutSegment === 'supply'
                                            ? 'text-primary bg-primary/10'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                                    }`}
                                    href={supplyPath}
                                >
                                    Supply
                                    {selectedLayoutSegment === 'supply' && (
                                        <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full"></span>
                                    )}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className={`relative rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                                        selectedLayoutSegments[0] === 'tx' &&
                                        selectedLayoutSegments[1] === '(inspector)'
                                            ? 'text-primary bg-primary/10'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                                    }`}
                                    href={inspectorPath}
                                >
                                    Inspector
                                    {selectedLayoutSegments[0] === 'tx' &&
                                        selectedLayoutSegments[1] === '(inspector)' && (
                                            <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-t-full"></span>
                                        )}
                                </Link>
                            </li>
                        </ul>

                        <div className="ml-4 flex items-center gap-2 border-l border-gray-200 pl-4 dark:border-gray-700">
                            <ThemeToggle />
                            <ClusterStatusButton />
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div
                    className={`${navOpened ? 'block' : 'hidden'} mt-2 border-t border-gray-200 pt-2 pb-4 lg:hidden dark:border-gray-700`}
                >
                    <ul className="space-y-1">
                        <li>
                            <Link
                                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
                                    selectedLayoutSegment === 'transactions'
                                        ? 'text-primary bg-primary/10'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                                }`}
                                href={transactionsPath}
                                onClick={navHandlers.close}
                            >
                                Transactions
                            </Link>
                        </li>
                        <li>
                            <Link
                                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
                                    selectedLayoutSegment === 'anchor-public-keys'
                                        ? 'text-primary bg-primary/10'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                                }`}
                                href={anchorPublicKeysPath}
                                onClick={navHandlers.close}
                            >
                                <span className="inline-flex items-center gap-2">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                        />
                                    </svg>
                                    Anchor Keys
                                </span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
                                    selectedLayoutSegment === 'feature-gates'
                                        ? 'text-primary bg-primary/10'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                                }`}
                                href={featureGatesPath}
                                onClick={navHandlers.close}
                            >
                                Feature Gates
                            </Link>
                        </li>
                        <li>
                            <Link
                                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
                                    selectedLayoutSegment === 'supply'
                                        ? 'text-primary bg-primary/10'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                                }`}
                                href={supplyPath}
                                onClick={navHandlers.close}
                            >
                                Supply
                            </Link>
                        </li>
                        <li>
                            <Link
                                className={`block rounded-md px-3 py-2 text-base font-medium transition-colors ${
                                    selectedLayoutSegments[0] === 'tx' && selectedLayoutSegments[1] === '(inspector)'
                                        ? 'text-primary bg-primary/10'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white'
                                }`}
                                href={inspectorPath}
                                onClick={navHandlers.close}
                            >
                                Inspector
                            </Link>
                        </li>
                    </ul>

                    <div className="mt-4 flex items-center gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                        <ThemeToggle />
                        <ClusterStatusButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}
