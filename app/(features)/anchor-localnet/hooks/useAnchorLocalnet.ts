'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey, AccountInfo, ParsedTransactionWithMeta } from '@solana/web3.js';
import { PROGRAMS, ProgramKey, ALL_PROGRAM_IDS } from '../config';

export interface ProgramAccountInfo {
  pubkey: string;
  lamports: number;
  dataSize: number;
  owner: string;
  executable: boolean;
  data: Buffer | null;
}

export interface ProgramStatus {
  programId: string;
  name: string;
  deployed: boolean;
  executable: boolean;
  dataSize: number;
  lamports: number;
  accountCount: number;
}

export interface LocalnetOverview {
  isRunning: boolean;
  slot: number;
  blockHeight: number;
  epoch: number;
  version: string;
  tps: number;
  programs: ProgramStatus[];
}

export interface RecentTransaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  err: boolean;
  programId: string | null;
  programName: string | null;
  instructionName: string | null;
  logs: string[];
}

/**
 * Hook to interact with Anchor programs on localnet.
 * Provides program status, account fetching, and transaction monitoring.
 */
export function useAnchorLocalnet(rpcUrl: string, enabled: boolean) {
  const [overview, setOverview] = useState<LocalnetOverview | null>(null);
  const [recentTxs, setRecentTxs] = useState<RecentTransaction[]>([]);
  const [programAccounts, setProgramAccounts] = useState<Record<string, ProgramAccountInfo[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<Connection | null>(null);
  const lastSlotRef = useRef<number>(0);

  // Get or create connection
  const getConnection = useCallback(() => {
    if (!connectionRef.current) {
      connectionRef.current = new Connection(rpcUrl, 'confirmed');
    }
    return connectionRef.current;
  }, [rpcUrl]);

  // Reset connection when URL changes
  useEffect(() => {
    connectionRef.current = null;
  }, [rpcUrl]);

  // Fetch overview status
  const fetchOverview = useCallback(async () => {
    if (!enabled) return;
    try {
      const conn = getConnection();
      const [slot, blockHeight, version, epochInfo, perfSamples] = await Promise.all([
        conn.getSlot().catch(() => 0),
        conn.getBlockHeight().catch(() => 0),
        conn.getVersion().then(v => v['solana-core'] || 'unknown').catch(() => 'unknown'),
        conn.getEpochInfo().catch(() => ({ epoch: 0 })),
        conn.getRecentPerformanceSamples(1).catch(() => []),
      ]);

      const tps = perfSamples.length > 0
        ? Math.round(perfSamples[0].numTransactions / perfSamples[0].samplePeriodSecs)
        : 0;

      // Check each program deployment status
      const programStatuses: ProgramStatus[] = await Promise.all(
        Object.entries(PROGRAMS).map(async ([key, prog]) => {
          try {
            const pubkey = new PublicKey(prog.id);
            const accountInfo = await conn.getAccountInfo(pubkey);
            
            // Count program-owned accounts
            let accountCount = 0;
            try {
              const accounts = await conn.getProgramAccounts(pubkey, {
                dataSlice: { offset: 0, length: 0 },
              });
              accountCount = accounts.length;
            } catch {
              // Program might not have accounts yet
            }

            return {
              programId: prog.id,
              name: prog.name,
              deployed: !!accountInfo,
              executable: accountInfo?.executable ?? false,
              dataSize: accountInfo?.data.length ?? 0,
              lamports: accountInfo?.lamports ?? 0,
              accountCount,
            };
          } catch {
            return {
              programId: prog.id,
              name: prog.name,
              deployed: false,
              executable: false,
              dataSize: 0,
              lamports: 0,
              accountCount: 0,
            };
          }
        })
      );

      setOverview({
        isRunning: true,
        slot,
        blockHeight,
        epoch: (epochInfo as any).epoch ?? 0,
        version,
        tps,
        programs: programStatuses,
      });
      setError(null);
    } catch (err) {
      setOverview(prev => prev ? { ...prev, isRunning: false } : {
        isRunning: false, slot: 0, blockHeight: 0, epoch: 0,
        version: 'not running', tps: 0, programs: [],
      });
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, getConnection]);

  // Fetch recent transactions for our programs
  const fetchRecentTransactions = useCallback(async () => {
    if (!enabled) return;
    try {
      const conn = getConnection();
      const txs: RecentTransaction[] = [];

      for (const prog of Object.values(PROGRAMS)) {
        try {
          const signatures = await conn.getSignaturesForAddress(
            new PublicKey(prog.id),
            { limit: 5 },
          );

          for (const sig of signatures) {
            // Skip already-seen transactions
            if (txs.some(t => t.signature === sig.signature)) continue;

            txs.push({
              signature: sig.signature,
              slot: sig.slot,
              blockTime: sig.blockTime ?? null,
              err: !!sig.err,
              programId: prog.id,
              programName: prog.name,
              instructionName: sig.memo ?? null,
              logs: [],
            });
          }
        } catch {
          // Program might not exist on localnet
        }
      }

      // Sort by slot desc
      txs.sort((a, b) => b.slot - a.slot);
      setRecentTxs(txs.slice(0, 50));
    } catch {
      // Ignore tx fetch errors
    }
  }, [enabled, getConnection]);

  // Fetch accounts for a specific program
  const fetchProgramAccounts = useCallback(async (programKey: ProgramKey) => {
    if (!enabled) return;
    try {
      const conn = getConnection();
      const prog = PROGRAMS[programKey];
      const pubkey = new PublicKey(prog.id);

      const accounts = await conn.getProgramAccounts(pubkey);
      const mapped: ProgramAccountInfo[] = accounts.map(({ pubkey: pk, account }) => ({
        pubkey: pk.toBase58(),
        lamports: account.lamports,
        dataSize: account.data.length,
        owner: account.owner.toBase58(),
        executable: account.executable,
        data: Buffer.from(account.data),
      }));

      setProgramAccounts(prev => ({ ...prev, [programKey]: mapped }));
    } catch (err) {
      setProgramAccounts(prev => ({ ...prev, [programKey]: [] }));
    }
  }, [enabled, getConnection]);

  // Fetch transaction logs
  const fetchTransactionLogs = useCallback(async (signature: string): Promise<string[]> => {
    try {
      const conn = getConnection();
      const tx = await conn.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
      return tx?.meta?.logMessages ?? [];
    } catch {
      return [];
    }
  }, [getConnection]);

  // Resolve PDA
  const findPDA = useCallback(async (programId: string, seeds: (string | Uint8Array)[]) => {
    try {
      const seedBuffers = seeds.map(s =>
        typeof s === 'string' ? Buffer.from(s) : Buffer.from(s)
      );
      const [pda, bump] = PublicKey.findProgramAddressSync(
        seedBuffers,
        new PublicKey(programId),
      );
      return { address: pda.toBase58(), bump };
    } catch (err) {
      return null;
    }
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!enabled) return;

    fetchOverview();
    fetchRecentTransactions();

    const interval = setInterval(() => {
      fetchOverview();
      fetchRecentTransactions();
    }, 5000);

    return () => clearInterval(interval);
  }, [enabled, fetchOverview, fetchRecentTransactions]);

  return {
    overview,
    recentTxs,
    programAccounts,
    isLoading,
    error,
    fetchOverview,
    fetchRecentTransactions,
    fetchProgramAccounts,
    fetchTransactionLogs,
    findPDA,
    getConnection,
  };
}
