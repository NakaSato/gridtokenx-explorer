import { AnchorProvider, Idl, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

import { Cluster } from '../utils/cluster';
import { formatSerdeIdl, getFormattedIdl } from '../utils/convertLegacyIdl';

// Simple wallet adapter for client-side use
class SimpleWallet implements Wallet {
  publicKey: PublicKey;
  payer: Keypair;

  constructor(publicKey: PublicKey = PublicKey.default) {
    this.payer = Keypair.generate(); // Generate a keypair for payer
    this.publicKey = publicKey;
  }

  async signTransaction(_tx: any): Promise<any> {
    throw new Error('SimpleWallet cannot sign transactions');
  }

  async signAllTransactions(_txs: any[]): Promise<any[]> {
    throw new Error('SimpleWallet cannot sign transactions');
  }
}

const cachedAnchorProgramPromises: Record<
  string,
  void | { __type: 'promise'; promise: Promise<void> } | { __type: 'result'; result: Idl | null }
> = {};

function getProvider(url: string) {
  return new AnchorProvider(
    new Connection(url),
    new SimpleWallet(PublicKey.default), // Use a simple wallet instead of NodeWallet
    {},
  );
}

function useIdlFromAnchorProgramSeed(programAddress: string, url: string, cluster?: Cluster): Idl | null {
  const key = `${programAddress}-${url}`;
  const cacheEntry = cachedAnchorProgramPromises[key];

  if (cacheEntry === undefined) {
    let promise;
    cluster = cluster || Cluster.MainnetBeta;
    if (cluster !== undefined && cluster !== Cluster.Custom) {
      promise = fetch(`/api/anchor?programAddress=${programAddress}&cluster=${cluster}`)
        .then(async result => {
          return result
            .json()
            .then(({ idl, error }) => {
              if (!idl) {
                throw new Error(error || `IDL not found for program: ${programAddress.toString()}`);
              }
              cachedAnchorProgramPromises[key] = {
                __type: 'result',
                result: idl,
              };
            })
            .catch(_ => {
              cachedAnchorProgramPromises[key] = { __type: 'result', result: null };
            });
        })
        .catch(_ => {
          cachedAnchorProgramPromises[key] = { __type: 'result', result: null };
        });
    } else {
      const programId = new PublicKey(programAddress);
      promise = Program.fetchIdl<Idl>(programId, getProvider(url))
        .then(idl => {
          if (!idl) {
            throw new Error(`IDL not found for program: ${programAddress.toString()}`);
          }

          cachedAnchorProgramPromises[key] = {
            __type: 'result',
            result: idl,
          };
        })
        .catch(_ => {
          cachedAnchorProgramPromises[key] = { __type: 'result', result: null };
        });
      cachedAnchorProgramPromises[key] = {
        __type: 'promise',
        promise,
      };
    }
    throw promise;
  } else if (cacheEntry.__type === 'promise') {
    throw cacheEntry.promise;
  }
  return cacheEntry.result;
}

export function useAnchorProgram(
  programAddress: string,
  url: string,
  cluster?: Cluster,
): { program: Program | null; idl: Idl | null } {
  // TODO(ngundotra): Rewrite this to be more efficient
  // const idlFromBinary = useIdlFromSolanaProgramBinary(programAddress);
  const idlFromAnchorProgram = useIdlFromAnchorProgramSeed(programAddress, url, cluster);
  const idl = idlFromAnchorProgram;
  const program: Program<Idl> | null = useMemo(() => {
    if (!idl) return null;
    try {
      const program = new Program(getFormattedIdl(formatSerdeIdl, idl, programAddress), getProvider(url));
      return program;
    } catch (e) {
      console.error('Error creating anchor program for', programAddress, e, { idl });
      return null;
    }
  }, [idl, programAddress, url]);

  return { idl, program };
}

export type AnchorAccount = {
  layout: string;
  account: object;
};
