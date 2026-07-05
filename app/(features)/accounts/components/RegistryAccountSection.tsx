import { Address } from '@/app/(shared)/components/common/Address';
import { SolBalance } from '@/app/(shared)/components/SolBalance';
import { TableCardBody } from '@/app/(shared)/components/common/TableCardBody';
import { Account } from '@/app/(core)/providers/accounts';
import {
  decodeRegistry,
  decodeRegistryMeter,
  decodeRegistryUser,
  METER_ACCOUNT_SIZE,
  REGISTRY_ACCOUNT_SIZE,
  USER_ACCOUNT_SIZE,
} from '@/app/(features)/anchor-localnet/lib/registry-decoders';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

const GRX_DECIMALS = 9;
const fmtGrx = (raw: number) =>
  (raw / 10 ** GRX_DECIMALS).toLocaleString(undefined, { maximumFractionDigits: 4 });
const fmtKwh = (raw: number) => raw.toLocaleString();

const UTC_FMT = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
});

const fmtTs = (unixSeconds: number) => (unixSeconds === 0 ? '—' : UTC_FMT.format(new Date(unixSeconds * 1000)));

/** Data-size gate — pair with an owner check against the registry program id. */
export function isRegistryAccountData(rawData: Buffer | undefined): rawData is Buffer {
  return (
    rawData !== undefined &&
    (rawData.length === REGISTRY_ACCOUNT_SIZE ||
      rawData.length === USER_ACCOUNT_SIZE ||
      rawData.length === METER_ACCOUNT_SIZE)
  );
}

export function RegistryAccountSection({ account }: { account: Account }) {
  const rawData = account.data.raw;
  if (!rawData) return null;

  if (rawData.length === USER_ACCOUNT_SIZE) return <UserCard account={account} data={rawData} />;
  if (rawData.length === METER_ACCOUNT_SIZE) return <MeterCard account={account} data={rawData} />;
  return <RegistryCard account={account} data={rawData} />;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Active'
      ? 'bg-green-500/15 text-green-500'
      : status === 'Suspended' || status === 'Maintenance'
        ? 'bg-orange-500/15 text-orange-500'
        : 'bg-red-500/15 text-red-500';
  return <span className={`rounded px-2 py-1 text-xs font-bold uppercase ${cls}`}>{status}</span>;
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
        <td>Owner Program (Registry)</td>
        <td className="lg:text-right">
          <Address pubkey={account.owner} alignRight link />
        </td>
      </tr>
    </>
  );
}

function RegistryCard({ account, data }: { account: Account; data: Buffer }) {
  const reg = decodeRegistry(data, account.pubkey.toBase58());
  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex items-center border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Registry</h3>
      </div>
      <TableCardBody>
        <CommonRows account={account} />
        <tr>
          <td>Authority</td>
          <td className="lg:text-right">
            <Address pubkey={new PublicKey(reg.authority)} alignRight link />
          </td>
        </tr>
        <tr>
          <td>Oracle Authority</td>
          <td className="lg:text-right">
            {reg.oracleAuthority ? <Address pubkey={new PublicKey(reg.oracleAuthority)} alignRight link /> : 'Not set'}
          </td>
        </tr>
        <tr>
          <td>Slash Destination</td>
          <td className="lg:text-right">
            {reg.slashDestination ? (
              <Address pubkey={new PublicKey(reg.slashDestination)} alignRight link />
            ) : (
              'Not set'
            )}
          </td>
        </tr>
        <tr>
          <td>Users</td>
          <td className="lg:text-right">{reg.userCount.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Meters (active / total)</td>
          <td className="lg:text-right">
            {reg.activeMeterCount.toLocaleString()} / {reg.meterCount.toLocaleString()}
          </td>
        </tr>
      </TableCardBody>
    </div>
  );
}

function UserCard({ account, data }: { account: Account; data: Buffer }) {
  const user = decodeRegistryUser(data, account.pubkey.toBase58());
  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Registry User — {user.userType}</h3>
        <StatusBadge status={user.status} />
      </div>
      <TableCardBody>
        <CommonRows account={account} />
        <tr>
          <td>User Authority (Wallet)</td>
          <td className="lg:text-right">
            <Address pubkey={new PublicKey(user.authority)} alignRight link />
          </td>
        </tr>
        <tr>
          <td>Validator Status</td>
          <td className="lg:text-right">{user.validatorStatus}</td>
        </tr>
        <tr>
          <td>Staked GRX</td>
          <td className="lg:text-right">{fmtGrx(user.stakedGrx)} GRX</td>
        </tr>
        <tr>
          <td>Meters</td>
          <td className="lg:text-right">{user.meterCount}</td>
        </tr>
        <tr>
          <td>Shard</td>
          <td className="lg:text-right">{user.shardId}</td>
        </tr>
        <tr>
          <td>Registered At (UTC)</td>
          <td className="lg:text-right">{fmtTs(user.registeredAt)}</td>
        </tr>
      </TableCardBody>
    </div>
  );
}

function MeterCard({ account, data }: { account: Account; data: Buffer }) {
  const meter = decodeRegistryMeter(data, account.pubkey.toBase58());
  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Registry Meter — {meter.meterType}</h3>
        <StatusBadge status={meter.status} />
      </div>
      <TableCardBody>
        <CommonRows account={account} />
        <tr>
          <td>Meter ID</td>
          <td className="font-mono lg:text-right">{meter.meterId}</td>
        </tr>
        <tr>
          <td>Owner (User Wallet)</td>
          <td className="lg:text-right">
            <Address pubkey={new PublicKey(meter.owner)} alignRight link />
          </td>
        </tr>
        <tr>
          <td>Zone</td>
          <td className="lg:text-right">{meter.zoneId}</td>
        </tr>
        <tr>
          <td>Total Generation</td>
          <td className="lg:text-right">{fmtKwh(meter.totalGeneration)}</td>
        </tr>
        <tr>
          <td>Total Consumption</td>
          <td className="lg:text-right">{fmtKwh(meter.totalConsumption)}</td>
        </tr>
        <tr>
          <td>Settled Net Generation</td>
          <td className="lg:text-right">{fmtKwh(meter.settledNetGeneration)}</td>
        </tr>
        <tr>
          <td>Claimed ERC Generation</td>
          <td className="lg:text-right">{fmtKwh(meter.claimedErcGeneration)}</td>
        </tr>
        <tr>
          <td>Registered At (UTC)</td>
          <td className="lg:text-right">{fmtTs(meter.registeredAt)}</td>
        </tr>
        <tr>
          <td>Last Reading At (UTC)</td>
          <td className="lg:text-right">{fmtTs(meter.lastReadingAt)}</td>
        </tr>
      </TableCardBody>
    </div>
  );
}
