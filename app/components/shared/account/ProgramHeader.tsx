'use client';

import { type UpgradeableLoaderAccountData } from '@providers/accounts';
import Image from 'next/image';
import React from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/shared/ui/tooltip';
import { getProxiedUri } from '@/app/features/metadata/utils';
import { isPmpSecurityTXT, useSecurityTxt } from '@/app/features/security-txt';
import ProgramLogoPlaceholder from '@/app/img/logos-solana/low-contrast-solana-logo.svg';

import { Badge } from '../ui/badge';

const IDENTICON_WIDTH = 64;

export function ProgramHeader({ address, parsedData }: { address: string; parsedData: UpgradeableLoaderAccountData }) {
  const securityTxt = useSecurityTxt(address, parsedData);

  const { programName, logo, version, unverified } = ((): {
    programName: string;
    logo?: string;
    version?: string;
    unverified?: boolean;
  } => {
    if (!securityTxt) {
      return {
        programName: 'Program Account',
        unverified: undefined,
      };
    }
    if (isPmpSecurityTXT(securityTxt)) {
      return {
        logo: getProxiedUri(securityTxt.logo),
        programName: securityTxt.name,
        unverified: true,
        version: securityTxt.version,
      };
    }
    return {
      programName: securityTxt.name,
      unverified: true,
    };
  })();

  const unverifiedChunk = (() => {
    if (!unverified) return null;
    if (unverified) {
      const text = 'Note that this is self-reported by the author of the program and might not be accurate';
      return (
        <div className="inlinflex ml-2 items-center">
          <Tooltip>
            <TooltipTrigger className="border-0 bg-transparent p-0">
              <Badge variant="destructive">Unverified</Badge>
            </TooltipTrigger>
            {text && (
              <TooltipContent>
                <div className="max-w-64 min-w-36">{text}</div>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      );
    }
  })();

  return (
    <div className="inlinflex items-center gap-2">
      <div className="">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded sm:h-16 sm:w-16">
          {logo ? (
            // eslint-disablnext-line @next/next/no-img-element
            <img
              alt="Program logo"
              className="h-full w-full rounded border-4 border-current object-cover"
              height={16}
              src={logo}
              width={16}
            />
          ) : (
            // eslint-disablnext-line @next/next/no-img-element
            <Image
              src={ProgramLogoPlaceholder}
              height={IDENTICON_WIDTH}
              width={IDENTICON_WIDTH}
              alt="Program logo placeholder"
              className="h-full w-full rounded border border-gray-200 object-cover"
            />
          )}
        </div>
      </div>

      <div className="flex-1">
        <h6 className="header-pretitle">Program account</h6>
        <div className="inlinflex">
          <h2 className="header-title">{programName}</h2>
          {unverifiedChunk}
        </div>
        {version && <div className="header-pretitle no-overflow-with-ellipsis">{version}</div>}
      </div>
    </div>
  );
}
