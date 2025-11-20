// Advanced search and filtering service for blockchain data

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

class SearchService {
  private cache = new Map<string, SearchResult[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Main search method
  async search<T>(filters: SearchFilters, options: SearchOptions = {}): Promise<SearchResult<T>[]> {
    const cacheKey = this.generateCacheKey(filters, options);

    // Check cache first
    const cached = this.getCachedResults(cacheKey);
    if (cached) {
      return cached;
    }

    // Perform search
    const results = await this.performSearch<T>(filters, options);

    // Cache results
    this.cacheResults(cacheKey, results);

    return results;
  }

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

  // Fuzzy search implementation
  private fuzzyMatch(text: string, query: string): boolean {
    if (!query) return true;

    const queryChars = query.toLowerCase().split('');
    const textChars = text.toLowerCase().split('');

    let queryIndex = 0;

    for (const char of textChars) {
      if (char === queryChars[queryIndex]) {
        queryIndex++;
        if (queryIndex === queryChars.length) return true;
      }
    }

    return false;
  }

  // Highlight matching text
  private highlightText(text: string, query: string): string {
    if (!query) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Generate cache key
  private generateCacheKey(filters: SearchFilters, options: SearchOptions): string {
    return JSON.stringify({ filters, options });
  }

  // Get cached results
  private getCachedResults(key: string): SearchResult[] | null {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  // Cache results
  private cacheResults(key: string, results: SearchResult[]): void {
    this.cache.set(key, results);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  // Perform actual search (mock implementation)
  private async performSearch<T>(filters: SearchFilters, options: SearchOptions): Promise<SearchResult<T>[]> {
    // In a real implementation, this would query the blockchain API
    // For now, we'll return mock results

    const { query, type = 'all', limit = 50, sortBy = 'relevance', sortOrder = 'desc' } = filters;

    let results: SearchResult<T>[] = [];

    // Mock search results based on type
    if (type === 'all' || type === 'account') {
      results.push(...this.getMockAccountResults(query, options));
    }

    if (type === 'all' || type === 'transaction') {
      results.push(...this.getMockTransactionResults(query, options));
    }

    if (type === 'all' || type === 'block') {
      results.push(...this.getMockBlockResults(query, options));
    }

    if (type === 'all' || type === 'program') {
      results.push(...this.getMockProgramResults(query, options));
    }

    // Apply additional filters
    if (filters.dateRange) {
      results = await this.filterByDateRange(
        results,
        'timestamp' as any,
        filters.dateRange.start,
        filters.dateRange.end,
      );
    }

    // Sort results
    results = await this.sortResults(results, sortBy as any, sortOrder);

    // Limit results
    return results.slice(0, limit);
  }

  // Mock account results
  private getMockAccountResults(query: string, options: SearchOptions): SearchResult[] {
    const accounts = [
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      '11111111111111111111111111111111111111',
      'SysvarRent111111111111111111111111111111111111',
      'SysvarC1ock11111111111111111111111111111111111',
    ].filter(
      address => !query || this.fuzzyMatch(address, query) || address.toLowerCase().includes(query.toLowerCase()),
    );

    return accounts.map(address => ({
      id: address,
      type: 'account' as const,
      title: address.slice(0, 16) + '...' + address.slice(-16),
      description: `Account: ${address}`,
      data: { address } as any,
      relevance: this.calculateRelevance(address, query),
      highlight: options.includeHighlights
        ? [
            {
              field: 'address',
              value: address,
            },
          ]
        : undefined,
    }));
  }

  // Mock transaction results
  private getMockTransactionResults(query: string, options: SearchOptions): SearchResult[] {
    return [
      {
        id: 'tx123456789',
        type: 'transaction' as const,
        title: 'Transfer Transaction',
        description: 'SOL transfer between accounts',
        data: {
          signature: '123456789abcdef',
          amount: 1.5,
          from: 'Account111...',
          to: 'Account222...',
        } as any,
        relevance: query ? 0.8 : 0.5,
        timestamp: new Date(),
      },
    ];
  }

  // Mock block results
  private getMockBlockResults(query: string, options: SearchOptions): SearchResult[] {
    return [
      {
        id: 'block123456',
        type: 'block' as const,
        title: 'Block #123456',
        description: 'Block with 25 transactions',
        data: {
          slot: 123456,
          blockhash: 'block123...',
          transactionCount: 25,
        } as any,
        relevance: query ? 0.7 : 0.5,
        timestamp: new Date(),
      },
    ];
  }

  // Mock program results
  private getMockProgramResults(query: string, options: SearchOptions): SearchResult[] {
    return [
      {
        id: 'program-token',
        type: 'program' as const,
        title: 'Token Program',
        description: 'SPL Token Program for managing tokens',
        data: {
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          name: 'Token Program',
        } as any,
        relevance: query ? 0.9 : 0.6,
        timestamp: new Date(),
      },
    ];
  }

  // Calculate relevance score
  private calculateRelevance(text: string, query: string): number {
    if (!query) return 0.5;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerText === lowerQuery) return 1.0;
    if (lowerText.includes(lowerQuery)) return 0.8;
    if (this.fuzzyMatch(lowerText, lowerQuery)) return 0.6;

    return 0.3;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.85, // Mock hit rate
    };
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

  const debouncedSearch = useMemo(() => debounce(performSearch, 300), [performSearch]);

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

// Import React hooks
import { useState, useCallback, useMemo, useEffect } from 'react';
