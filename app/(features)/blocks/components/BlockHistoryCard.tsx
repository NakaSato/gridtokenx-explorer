import { Address as AddressComponent } from '@/app/(shared)/components/Address';
import { ErrorCard } from '@/app/(shared)/components/ErrorCard';
import { Button } from '@/app/(shared)/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/app/(shared)/components/ui/dropdown-menu';
import { Input } from '@/app/(shared)/components/ui/input';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/(shared)/components/ui/table';
import { PublicKey, VersionedBlockResponse } from '@solana/web3.js';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Filter } from 'react-feather';
import { useBlockHistory } from '../hooks/useBlockHistory';
import { BlockHistoryRow } from './BlockHistoryRow';

const PAGE_SIZE = 25;

export function BlockHistoryCard({ block, epoch }: { block: VersionedBlockResponse; epoch: bigint | undefined }) {
  const [numDisplayed, setNumDisplayed] = React.useState(PAGE_SIZE);
  const searchParams = useSearchParams();
  const router = useRouter();

  const { accountFilter, filteredTransactions, invokedPrograms, programFilter, showComputeUnits, transactions } =
    useBlockHistory(block, epoch);

  const filterName = React.useMemo(() => {
    if (accountFilter) return 'Account';
    if (programFilter) return 'Program';
    return 'Filter';
  }, [accountFilter, programFilter]);

  const setFilter = (filterType: string, id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filterType === 'program') {
      params.set('program', id);
      params.delete('account');
    } else if (filterType === 'account') {
      params.set('account', id);
      params.delete('program');
    } else {
      params.delete('program');
      params.delete('account');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  if (transactions.length === 0) {
    return <ErrorCard text="This block has no transactions" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Block Transactions</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {filterName}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <div className="p-2">
                <Input
                  placeholder="Filter by program..."
                  value={programFilter || ''}
                  onChange={e => setFilter('program', e.target.value)}
                  className="mb-2"
                />
                <Input
                  placeholder="Filter by account..."
                  value={accountFilter || ''}
                  onChange={e => setFilter('account', e.target.value)}
                />
              </div>
              {invokedPrograms.size > 0 && (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold">Popular Programs</div>
                  {[...invokedPrograms.entries()]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([programId]) => (
                      <DropdownMenuCheckboxItem
                        key={programId}
                        checked={programFilter === programId}
                        onCheckedChange={() => setFilter('program', programId)}
                      >
                        <AddressComponent pubkey={new PublicKey(programId)} link={false} />
                      </DropdownMenuCheckboxItem>
                    ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {accountFilter && (
          <div className="bg-muted/50 px-6 py-4 text-sm">
            Filtering by account <AddressComponent pubkey={new PublicKey(accountFilter)} link />
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="px-6 py-4 text-center text-muted-foreground">No transactions found matching filter</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1">#</TableHead>
                <TableHead>Signature</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fee (SOL)</TableHead>
                {showComputeUnits && <TableHead>Compute Units</TableHead>}
                <TableHead>Invoked Programs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.slice(0, numDisplayed).map((tx, i) => (
                <BlockHistoryRow key={i} tx={tx} showComputeUnits={showComputeUnits} />
              ))}
            </TableBody>
          </Table>
        )}

        {filteredTransactions.length > numDisplayed && (
          <div className="border-t px-6 py-4">
            <Button className="w-full" onClick={() => setNumDisplayed(n => n + PAGE_SIZE)}>
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
