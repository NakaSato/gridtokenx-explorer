// Real-time data service for WebSocket connections and live updates
import { useState, useEffect } from 'react';

interface SubscriptionCallback<T> {
  (data: T): void;
}
interface SubscriptionOptions {
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

class RealtimeService {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, Set<SubscriptionCallback<any>>>();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private lastMessageId = 0;

  constructor(private wsUrl: string) {}

  // Connect to WebSocket
  connect(options: SubscriptionOptions = {}): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Resubscribe to all existing subscriptions
          this.resubscribeAll();
          resolve();
        };

        this.ws.onmessage = event => {
          this.handleMessage(event);
        };

        this.ws.onclose = event => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;

          if (options.reconnect && this.reconnectAttempts < (options.maxReconnectAttempts || 5)) {
            this.scheduleReconnect(options.reconnectInterval || 3000);
          }
        };

        this.ws.onerror = error => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.subscriptions.clear();
  }

  // Subscribe to specific data type
  subscribe<T>(channel: string, callback: SubscriptionCallback<T>): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }

    this.subscriptions.get(channel)!.add(callback);

    // Send subscription message if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscriptionMessage(channel);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(channel);
          this.sendUnsubscribeMessage(channel);
        }
      }
    };
  }

  // Send message to WebSocket
  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          ...data,
          id: ++this.lastMessageId,
          timestamp: Date.now(),
        }),
      );
    }
  }

  // Handle incoming messages
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      if (message.channel && message.data) {
        const callbacks = this.subscriptions.get(message.channel);
        if (callbacks) {
          callbacks.forEach(callback => callback(message.data));
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Send subscription message
  private sendSubscriptionMessage(channel: string): void {
    this.send({
      action: 'subscribe',
      channel,
    });
  }

  // Send unsubscribe message
  private sendUnsubscribeMessage(channel: string): void {
    this.send({
      action: 'unsubscribe',
      channel,
    });
  }

  // Resubscribe to all channels after reconnection
  private resubscribeAll(): void {
    this.subscriptions.forEach((_, channel) => {
      this.sendSubscriptionMessage(channel);
    });
  }

  // Schedule reconnection attempt
  private scheduleReconnect(interval: number): void {
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/5)...`);

      try {
        await this.connect({
          reconnect: true,
          reconnectInterval: interval,
        });
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, interval);
  }

  // Get connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Get connection state
  get connectionState(): string {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

// Real-time data hooks for React components
export function createRealtimeHook<T>(channel: string, realtimeService: RealtimeService) {
  return (initialData: T | null = null) => {
    const [data, setData] = useState<T | null>(initialData);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const unsubscribe = realtimeService.subscribe<T>(channel, (newData: T) => {
        setData(newData);
        setError(null);
      });

      // Update connection status
      const statusInterval = setInterval(() => {
        setIsConnected(realtimeService.isConnected);
      }, 1000);

      return () => {
        unsubscribe();
        clearInterval(statusInterval);
      };
    }, [channel]);

    return { data, isConnected, error };
  };
}

// Blockchain-specific real-time service
export class BlockchainRealtimeService extends RealtimeService {
  constructor(wsUrl: string = 'wss://api.mainnet-beta.solana.com') {
    super(wsUrl);
  }

  // Subscribe to account updates
  subscribeToAccountUpdates(pubkey: string, callback: SubscriptionCallback<any>) {
    return this.subscribe(`account:${pubkey}`, callback);
  }

  // Subscribe to block updates
  subscribeToBlockUpdates(callback: SubscriptionCallback<any>) {
    return this.subscribe('block', callback);
  }

  // Subscribe to transaction updates
  subscribeToTransactionUpdates(callback: SubscriptionCallback<any>) {
    return this.subscribe('transaction', callback);
  }

  // Subscribe to slot updates
  subscribeToSlotUpdates(callback: SubscriptionCallback<any>) {
    return this.subscribe('slot', callback);
  }

  // Subscribe to program activity
  subscribeToProgramActivity(programId: string, callback: SubscriptionCallback<any>) {
    return this.subscribe(`program:${programId}`, callback);
  }
}

// Create singleton instance
export const blockchainRealtimeService = new BlockchainRealtimeService();

// Export hooks for easy usage
export const useRealtimeAccount = createRealtimeHook('account', blockchainRealtimeService);
export const useRealtimeBlocks = createRealtimeHook('block', blockchainRealtimeService);
export const useRealtimeTransactions = createRealtimeHook('transaction', blockchainRealtimeService);
export const useRealtimeSlots = createRealtimeHook('slot', blockchainRealtimeService);
