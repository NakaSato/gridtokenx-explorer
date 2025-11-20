import { Address } from '@/app/(shared)/components/common/Address';
import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { LoadingCard } from '@/app/(shared)/components/common/LoadingCard';
import { SolBalance } from '@/app/(shared)/components/SolBalance';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/(shared)/components/ui/dropdown-menu';
import { Status, useFetchRichList, useRichList } from '@/app/(core)/providers/richList';
import { useSupply } from '@/app/(core)/providers/supply';
import { AccountBalancePair } from '@solana/web3.js';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useMemo } from 'react';
import { ChevronDown } from 'react-feather';

import { percentage } from '@/app/(shared)/utils/math';

type Filter = 'circulating' | 'nonCirculating' | 'all' | null;

export function TopAccountsCard() {
  const supply = useSupply();
  const richList = useRichList();
  const fetchRichList = useFetchRichList();
  const filter = useQueryFilter();

  if (typeof supply !== 'object') return null;

  if (richList === Status.Disconnected) {
    return <ErrorCard text="Not connected to the cluster" />;
  }

  if (richList === Status.Connecting) {
    return <LoadingCard />;
  }

  if (typeof richList === 'string') {
    return <ErrorCard text={richList} retry={fetchRichList} />;
  }

  let supplyCount: bigint;
  let accounts, header;

  if (richList !== Status.Idle) {
    switch (filter) {
      case 'nonCirculating': {
        accounts = richList.nonCirculating;
        supplyCount = supply.nonCirculating;
        header = 'Non-Circulating';
        break;
      }
      case 'all': {
        accounts = richList.total;
        supplyCount = supply.total;
        header = 'Total';
        break;
      }
      case 'circulating':
      default: {
        accounts = richList.circulating;
        supplyCount = supply.circulating;
        header = 'Circulating';
        break;
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Largest Accounts</CardTitle>
          <FilterDropdown filter={filter} />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {richList === Status.Idle && (
          <div className="p-6">
            <Button variant="outline" onClick={fetchRichList}>
              Load Largest Accounts
            </Button>
          </div>
        )}

        {accounts && (
          <div className="mb-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-muted-foreground">Rank</th>
                  <th className="text-muted-foreground">Address</th>
                  <th className="text-muted-foreground text-right">Balance (SOL)</th>
                  <th className="text-muted-foreground text-right">% of {header} Supply</th>
                </tr>
              </thead>
              <tbody className="list">
                {accounts.map((account, index) => renderAccountRow(account, index, supplyCount))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const renderAccountRow = (account: AccountBalancePair, index: number, supply: bigint) => {
  return (
    <tr key={index}>
      <td>
        <Badge variant="secondary">{index + 1}</Badge>
      </td>
      <td>
        <Address pubkey={account.address} link />
      </td>
      <td className="text-right">
        <SolBalance lamports={account.lamports} maximumFractionDigits={0} />
      </td>
      <td className="text-right">{percentage(BigInt(100 * account.lamports), supply, 4).toFixed(3) + '%'}</td>
    </tr>
  );
};

const useQueryFilter = (): Filter => {
  const currentSearchParams = useSearchParams();
  const filter = currentSearchParams?.get('filter');
  if (filter === 'circulating' || filter === 'nonCirculating' || filter === 'all') {
    return filter;
  } else {
    return null;
  }
};

const filterTitle = (filter: Filter): string => {
  switch (filter) {
    case 'nonCirculating': {
      return 'Non-Circulating';
    }
    case 'all': {
      return 'All';
    }
    case 'circulating':
    default: {
      return 'Circulating';
    }
  }
};

type DropdownProps = {
  filter: Filter;
};

const FilterDropdown = ({ filter }: DropdownProps) => {
  const FILTERS: Filter[] = ['all', null, 'nonCirculating'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {filterTitle(filter)} <ChevronDown size={13} className="ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {FILTERS.map(filterOption => (
          <FilterLink currentFilter={filter} filterOption={filterOption} key={filterOption} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

function FilterLink({ currentFilter, filterOption }: { currentFilter: Filter; filterOption: Filter }) {
  const currentPathname = usePathname();
  const currentSearchParams = useSearchParams();
  const href = useMemo(() => {
    const params = new URLSearchParams(currentSearchParams?.toString() || '');
    if (filterOption === null) {
      params.delete('filter');
    } else {
      params.set('filter', filterOption);
    }
    const queryString = params.toString();
    return `${currentPathname}${queryString ? `?${queryString}` : ''}`;
  }, [currentPathname, currentSearchParams, filterOption]);

  return (
    <DropdownMenuItem asChild>
      <Link href={href} className={filterOption === currentFilter ? 'font-semibold' : ''}>
        {filterTitle(filterOption)}
      </Link>
    </DropdownMenuItem>
  );
}
