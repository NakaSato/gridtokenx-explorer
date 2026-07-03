import {
  AddressLookupTableAccount,
  Message,
  MessageArgs,
  MessageCompiledInstruction,
  MessageV0,
  MessageV0Args,
  PublicKey,
  VersionedMessage,
} from '@solana/web3.js';
import { vi } from 'vitest';

import addressLookupTableFixtures from './fixtures/address-lookup-tables.json';

// stub a test to not allow passing without tests
test('stub', () => expect(true).toBeTruthy());

vi.mock('next/navigation', () => {
  const actual = vi.importActual('next/navigation');
  const cluster = 'mainnet-beta';
  const customUrl = undefined;

  return {
    ...actual,
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({
      push: vi.fn(),
    })),
    useSearchParams: vi.fn(() => ({
      get: (param: string) => {
        if (param === 'cluster') return cluster;
        return null;
      },
      has: (param: string) => {
        if (param === 'customUrl' && customUrl) return true;
        return false;
      },
      toString: () => {
        let clusterString;
        if (cluster !== 'mainnet-beta') clusterString = `cluster=${cluster}`;
        if (customUrl) {
          return `customUrl=${customUrl}${clusterString ? `&${clusterString}` : ''}`;
        }
        return clusterString ?? '';
      },
    })),
  };
});

export function deserializeMessage(message: string): VersionedMessage {
  const m = JSON.parse(message) as MessageArgs;
  const vm = new Message(m);

  return vm;
}

export function deserializeMessageV0(message: string): VersionedMessage {
  const m = JSON.parse(message);
  const messageArgs: MessageV0Args = {
    addressTableLookups:
      m.addressTableLookups?.map(
        (atl: { accountKey: string; writableIndexes: number[]; readonlyIndexes: number[] }) => {
          return {
            accountKey: new PublicKey(atl.accountKey),
            readonlyIndexes: atl.readonlyIndexes,
            writableIndexes: atl.writableIndexes,
          };
        },
      ) ?? [],
    compiledInstructions: m.compiledInstructions.map(
      (ci: {
        programIdIndex: number;
        accountKeyIndexes: number[];
        data: { [key: string]: number } | { type: 'Buffer'; data: number[] };
      }) => {
        let data: Uint8Array;
        if ('type' in ci.data) {
          data = Uint8Array.from(ci.data.data as number[]);
        } else {
          data = new Uint8Array([...Object.values(ci.data)]);
        }

        return {
          accountKeyIndexes: ci.accountKeyIndexes,
          data: data,
          programIdIndex: ci.programIdIndex,
        };
      },
    ),
    header: m.header,
    recentBlockhash: m.recentBlockhash,
    staticAccountKeys: m.staticAccountKeys.map((sak: string) => new PublicKey(sak)),
  };
  const vm = new MessageV0(messageArgs);

  return vm;
}

/**
 * Resolve a message's address table lookups from local fixtures instead of
 * mainnet RPC. The fixture file snapshots the real tables; the table
 * EDDSpjZHrsFKYTMJDcBqXAjkLcu9EKdvrQR4XnqsXErH was closed on mainnet, so its
 * entry is synthesized (only the positions the tests assert hold real
 * addresses).
 */
export function getMockAddressLookupTableAccounts(message: VersionedMessage): AddressLookupTableAccount[] {
  const fixtures = addressLookupTableFixtures as Record<string, string[]>;
  return (message.addressTableLookups ?? []).map(lookup => {
    const key = lookup.accountKey.toBase58();
    const addresses = fixtures[key];
    if (!addresses) {
      throw new Error(`No address lookup table fixture for ${key} — add it to fixtures/address-lookup-tables.json`);
    }
    return new AddressLookupTableAccount({
      key: lookup.accountKey,
      state: {
        addresses: addresses.map(address => new PublicKey(address)),
        deactivationSlot: BigInt('0xffffffffffffffff'),
        lastExtendedSlot: 0,
        lastExtendedSlotStartIndex: 0,
      },
    });
  });
}

export function deserializeInstruction(instruction: string): MessageCompiledInstruction {
  const data = JSON.parse(instruction);
  data.data = Uint8Array.from(data.data.data);

  return data;
}

export async function sleep(ms?: number): Promise<void> {
  const FALLBACK_TIMEOUT_MS = 2000;
  const timeoutMs =
    ms || (process.env.TEST_SERIAL_TIMEOUT ? Number(process.env.TEST_SERIAL_TIMEOUT.trim()) : FALLBACK_TIMEOUT_MS);
  return await new Promise(resolve => setTimeout(resolve, timeoutMs));
}
