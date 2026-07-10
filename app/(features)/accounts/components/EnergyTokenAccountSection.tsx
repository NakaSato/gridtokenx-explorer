'use client';

import { Address } from '@/app/(shared)/components/common/Address';
import { SolBalance } from '@/app/(shared)/components/SolBalance';
import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { Account, useFetchAccountInfo } from '@/app/(core)/providers/accounts';
import { useCluster } from '@/app/(core)/providers/cluster';
import {
  decodeEnergyTokenInfo,
  decodeGenerationMintRecord,
  GENERATION_MINT_RECORD_ACCOUNT_SIZE,
  GRX_DECIMALS,
  SETTLEMENT_WINDOW_MS,
  TOKEN_INFO_ACCOUNT_SIZE,
} from '@/app/(features)/anchor-localnet/lib/energy-token-decoders';
import { Connection, PublicKey } from '@solana/web3.js';
import React from 'react';

// Live-refresh: subscribe to this account over the RPC WebSocket and re-pull it
// through the AccountsProvider cache whenever it changes on-chain, so the
// TokenInfo / GenerationMintRecord card tracks mints without a manual reload.
// Mirrors the explorer page's onProgramAccountChange stream, scoped to one PDA.
function useLiveAccount(pubkey: PublicKey) {
  const { url } = useCluster();
  const fetchAccount = useFetchAccountInfo();
  const address = pubkey.toBase58();

  React.useEffect(() => {
    if (!url) return;
    const key = new PublicKey(address);
    let conn: Connection;
    let subId: number | undefined;
    try {
      conn = new Connection(url, 'confirmed');
      subId = conn.onAccountChange(key, () => fetchAccount(key, 'parsed'), 'confirmed');
    } catch (e) {
      console.warn('energy-token live account subscribe failed:', e);
      return;
    }
    return () => {
      if (subId !== undefined) conn.removeAccountChangeListener(subId).catch(() => {});
    };
  }, [url, address, fetchAccount]);
}

const fmtGrx = (raw: number) =>
  (raw / 10 ** GRX_DECIMALS).toLocaleString(undefined, { maximumFractionDigits: 4 });

const UTC_FMT = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
});
const UTC_TIME_FMT = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  timeZone: 'UTC',
});

/** Data-size gate — pair with an owner check against the energy token program id. */
export function isEnergyTokenAccountData(rawData: Buffer | undefined): rawData is Buffer {
  return (
    rawData !== undefined &&
    (rawData.length === TOKEN_INFO_ACCOUNT_SIZE || rawData.length === GENERATION_MINT_RECORD_ACCOUNT_SIZE)
  );
}

// Pulsing "LIVE" pill — signals the card is subscribed to on-chain changes.
function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-green-500/15 px-2 py-1 text-xs font-bold uppercase text-green-500">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      Live
    </span>
  );
}

export function EnergyTokenAccountSection({ account }: { account: Account }) {
  useLiveAccount(account.pubkey);

  const rawData = account.data.raw;
  if (!rawData) return null;

  if (rawData.length === GENERATION_MINT_RECORD_ACCOUNT_SIZE) {
    return <GenerationMintRecordCard account={account} data={rawData} />;
  }
  return <TokenInfoCard account={account} data={rawData} />;
}

function CommonRows({ account }: { account: Account }) {
  return (
    <>
      <tr>
        <td>Address</td>
        <td className="lg:text-right">
          <Address pubkey={account.pubkey} alignRight raw />
        </td>
      </tr>
      <tr>
        <td>Balance (SOL)</td>
        <td className="lg:text-right">
          <SolBalance lamports={account.lamports} />
        </td>
      </tr>
      <tr>
        <td>Allocated Data Size</td>
        <td className="lg:text-right">{account.space} byte(s)</td>
      </tr>
      <tr>
        <td>Owner Program (Energy Token)</td>
        <td className="lg:text-right">
          <Address pubkey={account.owner} alignRight link />
        </td>
      </tr>
    </>
  );
}

function GenerationMintRecordCard({ account, data }: { account: Account; data: Buffer }) {
  const rec = decodeGenerationMintRecord(data, account.pubkey.toBase58());
  const start = new Date(rec.windowMs);
  const end = new Date(rec.windowMs + SETTLEMENT_WINDOW_MS);

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Generation Mint Record</h3>
          <LiveBadge />
        </div>
        {rec.minted ? (
          <span className="rounded bg-green-500/15 px-2 py-1 text-xs font-bold uppercase text-green-500">Minted</span>
        ) : (
          <span className="rounded bg-orange-500/15 px-2 py-1 text-xs font-bold uppercase text-orange-500">
            Pending
          </span>
        )}
      </div>

      <TableCardBody>
        <CommonRows account={account} />
        <tr>
          <td>Meter ID</td>
          <td className="font-mono lg:text-right">{rec.meterId}</td>
        </tr>
        <tr>
          <td>Settlement Window (15 min, UTC)</td>
          <td className="lg:text-right">
            {UTC_FMT.format(start)} – {UTC_TIME_FMT.format(end)}
          </td>
        </tr>
        <tr>
          <td>GRX Minted</td>
          <td className="lg:text-right">
            {fmtGrx(rec.amount)} GRX <span className="text-muted-foreground">({rec.amount.toLocaleString()} raw)</span>
          </td>
        </tr>
        <tr>
          <td>PDA Bump</td>
          <td className="lg:text-right">{rec.bump}</td>
        </tr>
      </TableCardBody>
    </div>
  );
}

function TokenInfoCard({ account, data }: { account: Account; data: Buffer }) {
  const info = decodeEnergyTokenInfo(data, account.pubkey.toBase58());

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Energy Token Info</h3>
        <LiveBadge />
      </div>

      <TableCardBody>
        <CommonRows account={account} />
        <tr>
          <td>Authority</td>
          <td className="lg:text-right">
            <Address pubkey={new PublicKey(info.authority)} alignRight link />
          </td>
        </tr>
        <tr>
          <td>Registry Authority</td>
          <td className="lg:text-right">
            <Address pubkey={new PublicKey(info.registryAuthority)} alignRight link />
          </td>
        </tr>
        <tr>
          <td>Registry Program</td>
          <td className="lg:text-right">
            <Address pubkey={new PublicKey(info.registryProgram)} alignRight link />
          </td>
        </tr>
        <tr>
          <td>GRX Mint</td>
          <td className="lg:text-right">
            <Address pubkey={new PublicKey(info.mint)} alignRight link />
          </td>
        </tr>
        <tr>
          <td>Total Supply</td>
          <td className="lg:text-right">{fmtGrx(info.totalSupply)} GRX</td>
        </tr>
        <tr>
          <td>Created At (UTC)</td>
          <td className="lg:text-right">{UTC_FMT.format(new Date(info.createdAt * 1000))}</td>
        </tr>
        <tr>
          <td>REC Validators ({info.recValidatorsCount})</td>
          <td className="lg:text-right">
            {info.recValidators.length === 0
              ? 'None'
              : info.recValidators.map(v => (
                  <div key={v}>
                    <Address pubkey={new PublicKey(v)} alignRight link />
                  </div>
                ))}
          </td>
        </tr>
      </TableCardBody>
    </div>
  );
}
