import React from 'react';
import { Coins, CircleDollarSign, Lock } from 'lucide-react';

import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { LoadingCard } from '@/app/(shared)/components/common/LoadingCard';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Status, useFetchSupply, useSupply } from '@/app/(core)/providers/supply';
import { abbreviatedLamportsToSol, percentage } from '@/app/(shared)/utils/math';
import { StatTile } from './StatTile';

export function SupplyCard() {
  const supply = useSupply();
  const fetchSupply = useFetchSupply();

  // Fetch supply on load
  React.useEffect(() => {
    if (supply === Status.Idle) fetchSupply();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (supply === Status.Disconnected) {
    return <ErrorCard text="Not connected to the cluster" />;
  }

  if (supply === Status.Idle || supply === Status.Connecting) return <LoadingCard />;

  if (typeof supply === 'string') {
    return <ErrorCard text={supply} retry={fetchSupply} />;
  }

  const circulatingPct = percentage(supply.circulating * 100n, supply.total, 2);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatTile
        icon={Coins}
        accent="primary"
        label="Total Supply"
        value={`◎ ${abbreviatedLamportsToSol(supply.total)}`}
        sub="Native SOL, all accounts"
      />
      <StatTile
        icon={CircleDollarSign}
        accent="green"
        label="Circulating Supply"
        value={`◎ ${abbreviatedLamportsToSol(supply.circulating)}`}
        sub="Freely transferable"
        badge={
          <Badge variant="secondary" className="text-xs">
            {circulatingPct.toFixed(1)}%
          </Badge>
        }
      />
      <StatTile
        icon={Lock}
        accent="slate"
        label="Non-Circulating"
        value={`◎ ${abbreviatedLamportsToSol(supply.nonCirculating)}`}
        sub="Locked / reserved"
        badge={
          <Badge variant="secondary" className="text-xs">
            {(100 - circulatingPct).toFixed(1)}%
          </Badge>
        }
      />
    </div>
  );
}
