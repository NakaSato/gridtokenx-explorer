// Real-time data service for WebSocket connections using @solana/web3.js
import { Connection, PublicKey } from '@solana/web3.js';
import { useState, useEffect } from 'react';

// Use the environment variable for the RPC URL, falling back to mainnet-beta
const HTTP_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_HTTP ||
  'https://api.mainnet-beta.solana.com';

const WS_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_WS ||
  (HTTP_ENDPOINT.startsWith('http') ? HTTP_ENDPOINT.replace('http', 'ws') : undefined);

export class BlockchainRealtimeService {
  private connection: Connection;
  private isConnected: boolean = false;

  constructor() {
    // Initialize connection with the configured endpoint
    // We use 'confirmed' commitment for a good balance of speed and safety
    this.connection = new Connection(HTTP_ENDPOINT, {
      wsEndpoint: WS_ENDPOINT,
      commitment: 'confirmed',
    });
  }

  // Connect is mostly a no-op for @solana/web3.js as it handles connections lazily/internally
  // but we keep it to maintain the interface and allow for explicit initialization if needed
  connect() {
    if (this.isConnected) return;
    console.log('BlockchainRealtimeService: Connecting to', HTTP_ENDPOINT);
    this.isConnected = true;
  }

  disconnect() {
    this.isConnected = false;
    // @solana/web3.js doesn't have a strict "disconnect" method for the Connection object
    // that clears all listeners globally, but individual subscriptions return unsubscribe functions.
  }

  // Subscribe to account updates
  subscribeToAccountUpdates(pubkey: string, callback: (data: any) => void) {
    if (!this.isConnected) this.connect();

    try {
      const publicKey = new PublicKey(pubkey);
      const subscriptionId = this.connection.onAccountChange(publicKey, (accountInfo, context) => {
        callback({
          account: accountInfo,
          slot: context.slot,
        });
      });

      return () => {
        this.connection.removeAccountChangeListener(subscriptionId);
      };
    } catch (error) {
      console.error('Error subscribing to account updates:', error);
      return () => {};
    }
  }

  // Subscribe to logs (transactions)
  subscribeToTransactionUpdates(callback: (data: any) => void) {
    if (!this.isConnected) this.connect();

    try {
      // Subscribe to all logs ("all") or specific mentions
      const subscriptionId = this.connection.onLogs('all', (logs, context) => {
        callback({
          logs,
          slot: context.slot,
          signature: logs.signature,
        });
      });

      return () => {
        this.connection.removeOnLogsListener(subscriptionId);
      };
    } catch (error) {
      console.error('Error subscribing to transaction updates:', error);
      return () => {};
    }
  }

  // Subscribe to slot updates (new blocks)
  subscribeToSlotUpdates(callback: (data: any) => void) {
    if (!this.isConnected) this.connect();

    try {
      const subscriptionId = this.connection.onSlotChange(slotInfo => {
        callback(slotInfo);
      });

      return () => {
        this.connection.removeSlotChangeListener(subscriptionId);
      };
    } catch (error) {
      console.error('Error subscribing to slot updates:', error);
      return () => {};
    }
  }

  // Subscribe to program account changes
  subscribeToProgramActivity(programId: string, callback: (data: any) => void) {
    if (!this.isConnected) this.connect();

    try {
      const programKey = new PublicKey(programId);
      const subscriptionId = this.connection.onProgramAccountChange(
        programKey,
        (keyedAccountInfo, context) => {
          callback({
            accountId: keyedAccountInfo.accountId.toString(),
            accountInfo: keyedAccountInfo.accountInfo,
            slot: context.slot,
          });
        }
      );

      return () => {
        this.connection.removeProgramAccountChangeListener(subscriptionId);
      };
    } catch (error) {
      console.error('Error subscribing to program activity:', error);
      return () => {};
    }
  }
}

// Create singleton instance
export const blockchainRealtimeService = new BlockchainRealtimeService();

// React Hooks for easier usage

export function useRealtimeAccount(pubkey: string | null) {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!pubkey) return;

    setIsConnected(true);
    const unsubscribe = blockchainRealtimeService.subscribeToAccountUpdates(pubkey, setData);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [pubkey]);

  return { data, isConnected };
}

export function useRealtimeTransactions() {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(true);
    const unsubscribe = blockchainRealtimeService.subscribeToTransactionUpdates(setData);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, []);

  return { data, isConnected };
}

export function useRealtimeSlots() {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(true);
    const unsubscribe = blockchainRealtimeService.subscribeToSlotUpdates(setData);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, []);

  return { data, isConnected };
}

// Alias for blocks (using slots as proxy for now, or could use onRootChange)
export const useRealtimeBlocks = useRealtimeSlots;
