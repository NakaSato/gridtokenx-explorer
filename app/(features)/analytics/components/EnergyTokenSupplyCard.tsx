'use client';

import React from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Activity, Coins, ShieldCheck, Zap } from 'lucide-react';

import { Address } from '@/app/(shared)/components/common/Address';
import { ErrorCard } from '@/app/(shared)/components/common/ErrorCard';
import { LoadingCard } from '@/app/(shared)/components/common/LoadingCard';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';
import { useCluster } from '@/app/(core)/providers/cluster';
import { PROGRAMS } from '@/app/(features)/anchor-localnet/config';
import {
  decodeEnergyTokenInfo,
  decodeGenerationMintRecord,
  EnergyTokenInfoData,
  GENERATION_MINT_RECORD_ACCOUNT_SIZE,
  GRX_DECIMALS,
  TOKEN_INFO_ACCOUNT_SIZE,
} from '@/app/(features)/anchor-localnet/lib/energy-token-decoders';
import { StatTile } from './StatTile';

const fmtGrx = (raw: number) =>
  (raw / 10 ** GRX_DECIMALS).toLocaleString(undefined, { maximumFractionDigits: 2 });

interface EnergySupply {
  info: EnergyTokenInfoData | null;
  totalMinted: number;
  recordCount: number;
}

type Fetch = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ok'; data: EnergySupply };

/**
 * On-chain GRX (GridTokenX energy token) supply, decoded from the energy-token
 * program's TokenInfo PDA plus the GenerationMintRecord accounts. The energy
 * token only exists on localnet/custom clusters, so the supply page gates this
 * card on Cluster.Custom (same as the SOL rich-list card).
 */
export function EnergyTokenSupplyCard() {
  const { url } = useCluster();
  const [state, setState] = React.useState<Fetch>({ status: 'loading' });

  const fetchSupply = React.useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const conn = new Connection(url, 'confirmed');
      const programId = new PublicKey(PROGRAMS.energy_token.id);

      const [infoAccounts, genAccounts] = await Promise.all([
        conn.getProgramAccounts(programId, { filters: [{ dataSize: TOKEN_INFO_ACCOUNT_SIZE }] }),
        conn.getProgramAccounts(programId, { filters: [{ dataSize: GENERATION_MINT_RECORD_ACCOUNT_SIZE }] }),
      ]);

      const info = infoAccounts[0]
        ? decodeEnergyTokenInfo(infoAccounts[0].account.data, infoAccounts[0].pubkey.toBase58())
        : null;

      let totalMinted = 0;
      for (const { pubkey, account } of genAccounts) {
        totalMinted += decodeGenerationMintRecord(account.data, pubkey.toBase58()).amount;
      }

      setState({ status: 'ok', data: { info, totalMinted, recordCount: genAccounts.length } });
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : 'Failed to reach RPC endpoint' });
    }
  }, [url]);

  React.useEffect(() => {
    fetchSupply();
  }, [fetchSupply]);

  if (state.status === 'loading') return <LoadingCard />;
  if (state.status === 'error') return <ErrorCard text={state.message} retry={fetchSupply} />;

  const { info, totalMinted, recordCount } = state.data;

  if (!info) {
    return <ErrorCard text="No GRX TokenInfo account found on this cluster" retry={fetchSupply} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Coins}
          accent="yellow"
          label="Total GRX Supply"
          value={fmtGrx(info.totalSupply)}
          sub="Incl. seed & direct mints"
        />
        <StatTile
          icon={Zap}
          accent="yellow"
          label="Minted from Meters"
          value={fmtGrx(totalMinted)}
          sub="Across all windows"
        />
        <StatTile
          icon={Activity}
          accent="green"
          label="Generation Records"
          value={recordCount.toLocaleString()}
          sub="Proof-of-generation mints"
        />
        <StatTile
          icon={ShieldCheck}
          accent="green"
          label="REC Validators"
          value={info.recValidatorsCount.toString()}
          sub="Certification authority"
        />
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">Mint</span>
            <Address pubkey={new PublicKey(info.mint)} link truncateChars={16} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">Authority</span>
            <Address pubkey={new PublicKey(info.authority)} link truncateChars={16} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
