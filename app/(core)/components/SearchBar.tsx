'use client';

import { useHotkeys } from '@mantine/hooks';
import { useCluster } from '@/app/(core)/providers/cluster';
import { Cluster } from '@/app/(shared)/utils/cluster';
import { SearchElement, SearchOptions } from '@/app/(shared)/utils/search/types';
import {
  buildAppendableSearchOptions,
  buildDomainOptions,
  buildLocalOptions,
  buildTokenOptions,
} from '@/app/(shared)/utils/search/strategies';
import { useDebouncedAsync } from '@/app/(shared)/utils/use-debounce-async';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { MouseEventHandler, TouchEventHandler, useCallback, useId, useMemo, useRef } from 'react';
import { Search, X } from 'react-feather';
import { ActionMeta, components, ControlProps, InputActionMeta, SelectInstance } from 'react-select';
import AsyncSelect from 'react-select/async';

const hasDomainSyntax = (value: string) => {
  return value.length > 3 && value.split('.').length === 2;
};

const RESET_VALUE = '' as any;

export function SearchBar() {
  const [search, setSearch] = React.useState('');
  const router = useRouter();
  const { cluster, clusterInfo } = useCluster();
  const searchParams = useSearchParams();
  const selectRef = useRef<SelectInstance<SearchElement> | null>(null);

  const onChange = (option: SearchElement | null, meta: ActionMeta<any>) => {
    if (option === null || typeof option?.pathname !== 'string') {
      setSearch('');
      return;
    }
    const { pathname } = option;
    if (meta.action === 'select-option') {
      // Always use the pathname directly if it contains query params
      if (pathname.includes('?')) {
        router.push(pathname);
      } else {
        // Only preserve existing query params for paths without their own params
        const nextQueryString = searchParams?.toString();
        router.push(`${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`);
      }
      setSearch('');
    }
  };

  const onInputChange = useCallback((value: string, { action }: InputActionMeta) => {
    if (action === 'input-change') {
      setSearch(value);
    }
  }, []);

  async function performSearch(search: string): Promise<SearchOptions[]> {
    const localOptions = buildLocalOptions(search, cluster, clusterInfo?.epochInfo.epoch);
    const [tokenOptions, domainOptions] = await Promise.allSettled([
      buildTokenOptions(search, cluster),
      // buildFeatureOptions(search),
      hasDomainSyntax(search) && cluster === Cluster.MainnetBeta ? buildDomainOptions(search) : [],
    ]);

    const tokenOptionsAppendable = buildAppendableSearchOptions(tokenOptions, 'token');
    // const featureOptionsAppendable = buildAppendableSearchOptions(featureOptions, 'feature gates');
    const domainOptionsAppendable = buildAppendableSearchOptions(domainOptions, 'domain');

    return [...localOptions, ...domainOptionsAppendable, ...tokenOptionsAppendable];
  }

  const debouncedPerformSearch = useDebouncedAsync(performSearch, 500);

  // Substitute control component to insert custom clear button (the built in clear button only works with selected option, which is not the case)
  const Control = useMemo(
    () =>
      function ControlSubstitute({ children, ...props }: ControlProps<SearchElement, false>) {
        const clearHandler = useCallback(
          (e: React.MouseEvent<HTMLDivElement, globalThis.MouseEvent> | React.TouchEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setSearch('');
            selectRef.current?.clearValue();
            selectRef.current?.blur();
          },
          [],
        );
        const hasValue = Boolean(selectRef.current?.inputRef?.value);

        return (
          <components.Control {...props}>
            <Search className="text-muted-foreground mr-2 ml-1" size={16} />
            {children}
            {hasValue ? <ClearIndicator onClick={clearHandler} onTouchStart={clearHandler} /> : <KeyIndicator />}
          </components.Control>
        );
      },
    [setSearch, selectRef],
  );

  const onHotKeyPressHandler = useCallback(() => {
    selectRef.current?.focus();
  }, []);

  // Focus search on hotkey press
  useHotkeys(
    [
      ['/', onHotKeyPressHandler],
      ['mod+k', onHotKeyPressHandler],
    ],
    ['INPUT', 'TEXTAREA'],
  );

  const noOptionsMessageHandler = useCallback(() => 'No Results', []);
  const loadingMessageHandler = useCallback(() => 'loading...', []);
  const id = useId();

  return (
    <div className="w-full">
      <AsyncSelect
        cacheOptions
        defaultOptions
        loadOptions={debouncedPerformSearch}
        autoFocus
        ref={selectRef}
        inputId={id}
        noOptionsMessage={noOptionsMessageHandler}
        loadingMessage={loadingMessageHandler}
        placeholder="Search blocks, addresses, transactions, tokens..."
        value={RESET_VALUE}
        inputValue={search}
        blurInputOnSelect
        onChange={onChange}
        styles={{
          control: style => ({ ...style, pointerEvents: 'all' }),
          input: style => ({ ...style, width: '100%' }),
          /* work around for https://github.com/JedWatson/react-select/issues/3857 */
          placeholder: style => ({ ...style, pointerEvents: 'none' }),
        }}
        onInputChange={onInputChange}
        components={{ Control, DropdownIndicator: undefined, IndicatorSeparator: undefined }}
        classNamePrefix="search-bar"
      />
    </div>
  );
}

function KeyIndicator() {
  return <div className="key-indicator">/</div>;
}

function ClearIndicator({
  onClick,
  onTouchStart,
}: {
  onClick: MouseEventHandler<HTMLDivElement>;
  onTouchStart: TouchEventHandler<HTMLDivElement>;
}) {
  return (
    <div className="clear-indicator" onClick={onClick} onTouchStart={onTouchStart}>
      <X size={16} />
    </div>
  );
}

export default SearchBar;

