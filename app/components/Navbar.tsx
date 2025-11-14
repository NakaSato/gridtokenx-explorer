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
        <nav className="w-full bg-background border-b">
            <div className="container mx-auto px-4">
                <Link href={homePath}>
                    <Image alt="Solana Explorer" height={22} src={Logo} width={214} priority />
                </Link>

                <button className="p-2 text-gray-500 lg:hidden" type="button" onClick={navHandlers.toggle}>
                    <span className="block w-5 h-5"></span>
                </button>

                <div className="navbar-children flex items-center flex-grow w-full h-full hidden lg:block">
                    {children}
                </div>

                <div className={`${navOpened ? 'block' : 'hidden'} w-full lg:flex lg:w-auto ml-auto shrink-0`}>
                    <ul className="flex flex-col lg:flex-row gap-1 mr-auto">
                        <li className="block">
                            <Link
                                className={`block px-3 py-2 text-gray-700 hover:text-gray-900 ${selectedLayoutSegment === 'transactions' ? 'text-primary font-semibold' : ''}`}
                                href={transactionsPath}
                            >
                                Transactions
                            </Link>
                        </li>
                        <li className="block">
                            <Link
                                className={`block px-3 py-2 text-gray-700 hover:text-gray-900 ${selectedLayoutSegment === 'anchor-public-keys' ? 'text-primary font-semibold' : ''}`}
                                href={anchorPublicKeysPath}
                            >
                                🔗 Anchor Keys
                            </Link>
                        </li>
                        <li className="block">
                            <Link
                                className={`block px-3 py-2 text-gray-700 hover:text-gray-900 ${selectedLayoutSegment === 'feature-gates' ? 'text-primary font-semibold' : ''}`}
                                href={featureGatesPath}
                            >
                                Feature Gates
                            </Link>
                        </li>
                        <li className="block">
                            <Link
                                className={`block px-3 py-2 text-gray-700 hover:text-gray-900 ${selectedLayoutSegment === 'supply' ? 'text-primary font-semibold' : ''}`}
                                href={supplyPath}
                            >
                                Supply
                            </Link>
                        </li>
                        <li className="block">
                            <Link
                                className={`block px-3 py-2 text-gray-700 hover:text-gray-900 ${
                                    selectedLayoutSegments[0] === 'tx' && selectedLayoutSegments[1] === '(inspector)'
                                        ? 'text-primary font-semibold'
                                        : ''
                                }`}
                                href={inspectorPath}
                            >
                                Inspector
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="hidden lg:block shrink-0 ml-1">
                    <ClusterStatusButton />
                </div>
            </div>
        </nav>
    );
}
