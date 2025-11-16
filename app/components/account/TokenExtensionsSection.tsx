import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@components/shared/ui/accordion';
import { Card } from '@components/shared/ui/card';
import { SyntheticEvent, useCallback, useMemo, useRef, useState } from 'react';
import { Code, ExternalLink } from 'react-feather';

import { SolarizedJsonViewer as ReactJson } from '@/app/components/common/JsonViewer';
import { TableCardBodyHeaded } from '@/app/components/common/TableCardBody';
import { Badge } from '@/app/components/shared/ui/badge';
import {
  getAnchorId,
  useTokenExtensionNavigation,
} from '@/app/features/token-extensions/use-token-extension-navigation';
import { TokenExtension } from '@/app/validators/accounts/token-extension';

import { TokenExtensionBadge } from '../common/TokenExtensionBadge';
import { TokenExtensionRow } from './TokenAccountSection';
import { ParsedTokenExtension } from './types';

export function TokenExtensionsSection({
  address,
  decimals,
  extensions,
  parsedExtensions,
  symbol,
}: {
  address: string;
  decimals: number;
  extensions: TokenExtension[];
  parsedExtensions: ParsedTokenExtension[];
  symbol?: string;
}) {
  const { activeExtension: selectedExtension, setActiveExtension: setSelectedExtension } = useTokenExtensionNavigation({
    uriComponent: `/address/${address}`,
  });

  const onSelect = useCallback(
    (id: string) => {
      setSelectedExtension(id === selectedExtension ? undefined : id);
    },
    [selectedExtension, setSelectedExtension],
  );

  // handle accordion item click to change the selected extension
  const handleSelect = useCallback(
    (e: SyntheticEvent<HTMLDivElement>) => {
      const selectedValue = e.currentTarget.dataset.value;
      if (selectedValue === selectedExtension) {
        setSelectedExtension(undefined);
      }
    },
    [selectedExtension, setSelectedExtension],
  );

  return (
    <Accordion type="single" value={selectedExtension} collapsible className="px-0">
      {parsedExtensions.map(ext => {
        const extension = extensions.find(({ extension }) => {
          return extension === ext.extension;
        });

        return (
          <AccordionItem id={getAnchorId(ext)} key={ext.extension} value={ext.extension} onClick={handleSelect}>
            {extension && (
              <TokenExtensionAccordionItem
                decimals={decimals}
                extension={extension}
                onSelect={onSelect}
                parsedExtension={ext}
                symbol={symbol}
              />
            )}
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function TokenExtensionAccordionItem({
  decimals,
  extension,
  onSelect,
  parsedExtension,
  symbol,
}: {
  decimals: number;
  extension: TokenExtension;
  onSelect: (id: string) => void;
  parsedExtension: ParsedTokenExtension;
  symbol?: string;
}) {
  const [showRaw, setShowRaw] = useState(false);
  const accordionTriggerRef = useRef<HTMLButtonElement>(null);

  const handleToggleRaw = useCallback(() => {
    onSelect(parsedExtension.extension);
    setShowRaw(!showRaw);
  }, [showRaw, onSelect, parsedExtension.extension]);

  const tableHeaderComponent = useMemo(() => {
    return TokenExtensionStateHeader({ name: parsedExtension.name });
  }, [parsedExtension.name]);

  return (
    <>
      <AccordionTrigger className="items-center" ref={accordionTriggerRef}>
        <ExtensionListItem ext={parsedExtension} onToggleRaw={handleToggleRaw} raw={showRaw} />
      </AccordionTrigger>
      <AccordionContent>
        {!showRaw ? (
          <Card className="m-4">
            <TableCardBodyHeaded headerComponent={tableHeaderComponent}>
              {TokenExtensionRow(extension, undefined, decimals, symbol, 'omit')}
            </TableCardBodyHeaded>
          </Card>
        ) : (
          <div className="p-4">
            <ReactJson src={parsedExtension.parsed || {}} style={{ padding: 25 }} />
          </div>
        )}
      </AccordionContent>
    </>
  );
}

function TokenExtensionStateHeader({ name }: { name: string }) {
  return (
    <tr>
      <th className="text-muted-foreground w-1">{name}</th>
      <th className="text-muted-foreground"></th>
    </tr>
  );
}

function ExtensionListItem({
  ext,
  onToggleRaw,
  raw,
}: {
  ext: ParsedTokenExtension;
  onToggleRaw: () => void;
  raw: boolean;
}) {
  const handleToggleRaw = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.stopPropagation();
      onToggleRaw();
    },
    [onToggleRaw],
  );

  return (
    <div className="grid-cols-12-ext grid w-100 items-center gap-2 text-sm text-white">
      {/* Name */}
      <div className="whitespacnowrap flex min-w-80 items-center gap-2 font-normal max-sm:col-span-6 sm:col-span-6 md:col-span-6 lg:col-span-4 xl:col-span-3">
        <div>{ext.name}</div>
        <TokenExtensionBadge extension={ext} />
      </div>

      {/* Description */}
      <span className="text-[0.75rem] text-[#8E9090] underline decoration-[#1e2423] max-lg:hidden lg:col-span-6 lg:pl-12 xl:col-span-7">
        {ext.description ?? null}
      </span>

      {/* External links badges */}
      <div className="flex justify-end gap-1 text-white max-sm:col-span-6 sm:col-span-6 md:col-span-6 lg:col-span-2 xl:col-span-2">
        <a key="raw" href="javascript:void(0)" onClick={handleToggleRaw}>
          <Badge className="font-normal text-white" variant={raw ? 'default' : 'outline'}>
            <Code size={16} /> Raw
          </Badge>
        </a>
        {ext.externalLinks.map((link, index) => (
          <a key={index} href={link.url} target="_blank" rel="noopener noreferrer">
            <Badge variant="outline" className="font-normal text-white">
              <ExternalLink size={16} />
              {link.label}
            </Badge>
          </a>
        ))}
      </div>
    </div>
  );
}
