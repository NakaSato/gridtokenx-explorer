// Advanced search and filtering service for blockchain data
import { Connection, PublicKey } from '@solana/web3.js';
import { useState, useCallback, useMemo, useEffect } from 'react';

// Use the environment variable for the RPC URL, falling back to mainnet-beta
const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_HTTP || 'https://api.mainnet-beta.solana.com';

export interface SearchFilters {
  query?: string;
  type?: 'account' | 'transaction' | 'block' | 'program' | 'all';
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  amountRange?: {
    min?: number;
    max?: number;
  };
  status?: 'success' | 'failed' | 'pending' | 'all';
  programId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'amount' | 'slot' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T = any> {
  id: string;
  type: 'account' | 'transaction' | 'block' | 'program';
  title: string;
  description: string;
  data: T;
  relevance?: number;
  timestamp?: Date;
  highlight?: {
    field: string;
    value: string;
  }[];
}

export interface SearchOptions {
  fuzzy?: boolean;
  caseSensitive?: boolean;
  includeHighlights?: boolean;
  maxResults?: number;
}

import { CacheManager, CacheStats } from './cache';

// ... imports ...

class SearchService {
  private connection: Connection;
  private cache: CacheManager;

  constructor() {
    this.connection = new Connection(RPC_ENDPOINT, 'confirmed');
    this.cache = new CacheManager({
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      strategy: 'lru',
    });
  }

  // Main search method
  async search<T>(filters: SearchFilters, options: SearchOptions = {}): Promise<SearchResult<T>[]> {
    const cacheKey = this.generateCacheKey(filters, options);

    // Check cache first
    const cached = this.cache.get<SearchResult<T>[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Perform search
    const results = await this.performSearch<T>(filters, options);

    // Cache results
    this.cache.set(cacheKey, results);

    return results;
  }

  // ... (searchAccounts, searchTransactions, searchBlocks, searchPrograms methods remain the same, they call this.search) ...
  // Search accounts
  async searchAccounts(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const filters: SearchFilters = {
      query,
      type: 'account',
      limit: options.maxResults || 50,
    };

    return this.search(filters, options);
  }

  // Search transactions
  async searchTransactions(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const filters: SearchFilters = {
      query,
      type: 'transaction',
      limit: options.maxResults || 50,
    };

    return this.search(filters, options);
  }

  // Search blocks
  async searchBlocks(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const filters: SearchFilters = {
      query,
      type: 'block',
      limit: options.maxResults || 50,
    };

    return this.search(filters, options);
  }

  // Search programs
  async searchPrograms(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const filters: SearchFilters = {
      query,
      type: 'program',
      limit: options.maxResults || 50,
    };

    return this.search(filters, options);
  }

  // Advanced filtering
  async filterByDateRange<T>(data: T[], dateField: keyof T, start?: Date, end?: Date): Promise<T[]> {
    if (!start && !end) return data;

    return data.filter(item => {
      const itemDate = new Date(item[dateField] as any);

      if (start && itemDate < start) return false;
      if (end && itemDate > end) return false;

      return true;
    });
  }

  // Filter by amount range
  async filterByAmountRange<T>(data: T[], amountField: keyof T, min?: number, max?: number): Promise<T[]> {
    if (!min && !max) return data;

    return data.filter(item => {
      const amount = Number(item[amountField] as any);

      if (min !== undefined && amount < min) return false;
      if (max !== undefined && amount > max) return false;

      return true;
    });
  }

  // Sort results
  async sortResults<T>(data: T[], sortBy: keyof T, order: 'asc' | 'desc' = 'desc'): Promise<T[]> {
    return [...data].sort((a, b) => {
      const aVal = a[sortBy] as any;
      const bVal = b[sortBy] as any;

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Generate cache key
  private generateCacheKey(filters: SearchFilters, options: SearchOptions): string {
    return JSON.stringify({ filters, options });
  }

  // Perform actual search using Solana RPC
  private async performSearch<T>(filters: SearchFilters, options: SearchOptions): Promise<SearchResult<T>[]> {
    const { query, type = 'all', limit = 50 } = filters;
    if (!query) return [];

    const results: SearchResult<T>[] = [];
    const trimmedQuery = query.trim();

    // 1. Check if it's a Block (number)
    if ((type === 'all' || type === 'block') && /^\d+$/.test(trimmedQuery)) {
      try {
        const slot = parseInt(trimmedQuery, 10);
        // We fetch the block time to verify it exists, getBlock can be heavy so maybe just getBlockTime first?
        // Or just try getBlock with minimal transaction details
        const block = await this.connection.getBlock(slot, {
          maxSupportedTransactionVersion: 0,
          transactionDetails: 'none', // We just want to verify existence and get basic info
          rewards: false,
        });

        if (block) {
          results.push({
            id: slot.toString(),
            type: 'block',
            title: `Block #${slot}`,
            description: `Block at slot ${slot} with ${block.blockhash}`,
            data: { slot, block } as any,
            relevance: 1.0,
            timestamp: block.blockTime ? new Date(block.blockTime * 1000) : undefined,
          });
        }
      } catch (e) {
        // Block might not exist or be too old/future
        console.debug('Block search failed', e);
      }
    }

    // 2. Check if it's a valid PublicKey (Account or Program)
    let pubkey: PublicKey | null = null;
    try {
      pubkey = new PublicKey(trimmedQuery);
    } catch (e) {
      // Not a public key
    }

    if (pubkey && (type === 'all' || type === 'account' || type === 'program')) {
      try {
        const accountInfo = await this.connection.getAccountInfo(pubkey);
        if (accountInfo) {
          const isProgram = accountInfo.executable;
          
          if ((type === 'all') || (type === 'program' && isProgram) || (type === 'account' && !isProgram)) {
             results.push({
              id: trimmedQuery,
              type: isProgram ? 'program' : 'account',
              title: isProgram ? 'Program' : 'Account',
              description: `${isProgram ? 'Program' : 'Account'} Address: ${trimmedQuery}`,
              data: { address: trimmedQuery, accountInfo } as any,
              relevance: 1.0,
            });
          }
        }
      } catch (e) {
        console.debug('Account search failed', e);
      }
    }

    // 3. Check if it's a Transaction Signature
    // Signatures are base58 encoded and usually around 88 chars, but can vary.
    // We'll just try to fetch it if it looks vaguely like a signature (base58 chars)
    const isBase58 = /^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmedQuery);
    if (isBase58 && trimmedQuery.length > 60 && trimmedQuery.length < 100 && (type === 'all' || type === 'transaction')) {
        try {
            // getSignatureStatus is faster than getTransaction to check existence
            const { value } = await this.connection.getSignatureStatus(trimmedQuery);
            
            if (value) {
                 // If it exists, we can optionally fetch more details, but for search results, existence + status is often enough
                 // However, to show a "title" or "description" we might want the transaction, but that's heavy.
                 // Let's just return the signature result.
                 results.push({
                    id: trimmedQuery,
                    type: 'transaction',
                    title: 'Transaction',
                    description: `Signature: ${trimmedQuery.slice(0, 8)}...${trimmedQuery.slice(-8)}`,
                    data: { signature: trimmedQuery, status: value } as any,
                    relevance: 1.0,
                 });
            }
        } catch (e) {
            console.debug('Transaction search failed', e);
        }
    }

    return results;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }
}

// Create singleton instance
export const searchService = new SearchService();

// React hooks for search functionality
export function useSearch<T = any>(filters: SearchFilters, options: SearchOptions = {}) {
  const [results, setResults] = useState<SearchResult<T>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(
    async (newFilters?: SearchFilters) => {
      setLoading(true);
      setError(null);

      try {
        const searchResults = await searchService.search<T>(newFilters || filters, options);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    },
    [filters, options],
  );

  const debouncedSearch = useMemo(() => debounce(performSearch, 500), [performSearch]);

  useEffect(() => {
    debouncedSearch();
  }, [debouncedSearch]);

  return {
    results,
    loading,
    error,
    search: performSearch,
    clearResults: () => setResults([]),
  };
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
