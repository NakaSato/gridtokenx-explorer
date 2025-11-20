// Advanced caching service for blockchain data

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  strategy?: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
  persist?: boolean; // Whether to persist to localStorage
  compression?: boolean; // Whether to compress cached data
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  compressed?: boolean;
  size: number;
}

export interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  totalRequests: number;
  memoryUsage: number;
  evictions: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder: string[] = []; // For LRU
  private stats: CacheStats = {
    size: 0,
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    memoryUsage: 0,
    evictions: 0,
  };

  constructor(private options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 1000,
      strategy: 'lru',
      persist: false,
      compression: false,
      ...options,
    };

    // Load from localStorage if persistence is enabled
    if (this.options.persist) {
      this.loadFromStorage();
    }
  }

  // Get value from cache
  get<T>(key: string): T | null {
    this.stats.totalRequests++;

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.missRate = (this.stats.missRate * (this.stats.totalRequests - 1) + 1) / this.stats.totalRequests;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.missRate = (this.stats.missRate * (this.stats.totalRequests - 1) + 1) / this.stats.totalRequests;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // Update LRU order
    if (this.options.strategy === 'lru') {
      this.updateAccessOrder(key);
    }

    this.stats.hitRate = (this.stats.hitRate * (this.stats.totalRequests - 1) + 1) / this.stats.totalRequests;

    // Return decompressed data if needed
    return entry.compressed ? this.decompress(entry.data) : entry.data;
  }

  // Set value in cache
  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.options.ttl!;
    const now = Date.now();

    let processedData = data;
    let compressed = false;
    let size = this.calculateSize(data);

    // Compress if enabled and data is large enough
    if (this.options.compression && size > 1024) {
      processedData = this.compress(data);
      compressed = true;
      size = this.calculateSize(processedData);
    }

    const entry: CacheEntry<T> = {
      data: processedData,
      timestamp: now,
      ttl,
      accessCount: 0,
      lastAccessed: now,
      compressed,
      size,
    };

    // Check if we need to evict items
    if (this.cache.size >= this.options.maxSize!) {
      this.evictItems();
    }

    this.cache.set(key, entry);
    this.addToAccessOrder(key);
    this.updateStats();

    // Persist if enabled
    if (this.options.persist) {
      this.saveToStorage();
    }
  }

  // Delete value from cache
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
      this.updateStats();

      if (this.options.persist) {
        this.saveToStorage();
      }
    }

    return deleted;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.updateStats();

    if (this.options.persist) {
      this.clearStorage();
    }
  }

  // Check if key exists
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && Date.now() <= entry.timestamp + entry.ttl;
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Evict items based on strategy
  private evictItems(): void {
    const itemsToEvict = Math.ceil(this.options.maxSize! * 0.1); // Evict 10%

    switch (this.options.strategy) {
      case 'lru':
        this.evictLRU(itemsToEvict);
        break;
      case 'fifo':
        this.evictFIFO(itemsToEvict);
        break;
      case 'lfu':
        this.evictLFU(itemsToEvict);
        break;
    }
  }

  // Evict least recently used items
  private evictLRU(count: number): void {
    const keys = this.accessOrder.slice(0, count);
    keys.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });
    this.accessOrder = this.accessOrder.slice(count);
  }

  // Evict first-in items
  private evictFIFO(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, count);

    entries.forEach(([key]) => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.evictions++;
    });
  }

  // Evict least frequently used items
  private evictLFU(count: number): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].accessCount - b[1].accessCount)
      .slice(0, count);

    entries.forEach(([key]) => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.evictions++;
    });
  }

  // Update access order for LRU
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  // Add to access order
  private addToAccessOrder(key: string): void {
    if (this.options.strategy === 'lru') {
      this.accessOrder.push(key);
    }
  }

  // Remove from access order
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  // Update cache statistics
  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.memoryUsage = Array.from(this.cache.values()).reduce((total, entry) => total + entry.size, 0);
  }

  // Calculate approximate size of data
  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  // Simple compression (in production, use a proper compression library)
  private compress(data: any): string {
    const compressed = JSON.stringify(data)
      .replace(/\s+/g, '') // Remove whitespace
      .replace(/"/g, "'") // Use single quotes
      .replace(/,/g, ';'); // Replace commas

    return btoa(compressed); // Base64 encode
  }

  // Simple decompression
  private decompress(compressed: string): any {
    try {
      const decompressed = atob(compressed).replace(/;/g, ',').replace(/'/g, '"');

      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Decompression failed:', error);
      return null;
    }
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('blockchain-cache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('blockchain-cache');
      if (data) {
        const entries = JSON.parse(data);
        this.cache = new Map(entries);
        this.updateStats();
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  // Clear localStorage
  private clearStorage(): void {
    try {
      localStorage.removeItem('blockchain-cache');
    } catch (error) {
      console.error('Failed to clear cache storage:', error);
    }
  }
}

// Create cache instances for different data types
export const accountCache = new CacheManager({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 500,
  strategy: 'lru',
  persist: true,
});

export const transactionCache = new CacheManager({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  strategy: 'lru',
  persist: false,
});

export const blockCache = new CacheManager({
  ttl: 15 * 60 * 1000, // 15 minutes
  maxSize: 200,
  strategy: 'fifo',
  persist: false,
});

export const analyticsCache = new CacheManager({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
  strategy: 'lfu',
  persist: true,
  compression: true,
});

// React hooks for cache management
export function useCache<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState<CacheStats | null>(null);

  const cacheRef = React.useRef(new CacheManager(options));

  const fetchData = React.useCallback(
    async (forceRefresh = false) => {
      // Try to get from cache first
      if (!forceRefresh) {
        const cachedData = cacheRef.current.get<T>(key);
        if (cachedData) {
          setData(cachedData);
          setStats(cacheRef.current.getStats());
          return;
        }
      }

      // Fetch fresh data
      setLoading(true);
      setError(null);

      try {
        const freshData = await fetcher();
        cacheRef.current.set(key, freshData);
        setData(freshData);
        setStats(cacheRef.current.getStats());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    },
    [key, fetcher],
  );

  // Initial fetch
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    stats,
    refresh: () => fetchData(true),
    clear: () => {
      cacheRef.current.clear();
      setData(null);
      setStats(null);
    },
  };
}

// Cache warming utilities
export const warmCache = async (keys: string[], fetcher: (key: string) => Promise<any>, cache: CacheManager) => {
  const promises = keys.map(async key => {
    if (!cache.has(key)) {
      try {
        const data = await fetcher(key);
        cache.set(key, data);
      } catch (error) {
        console.error(`Failed to warm cache for key ${key}:`, error);
      }
    }
  });

  await Promise.allSettled(promises);
};

// Cache invalidation utilities
export const invalidateCache = (pattern: string | RegExp, ...caches: CacheManager[]) => {
  caches.forEach(cache => {
    const keys = cache.keys();
    const keysToDelete = keys.filter(key => {
      if (typeof pattern === 'string') {
        return key.includes(pattern);
      } else {
        return pattern.test(key);
      }
    });

    keysToDelete.forEach(key => cache.delete(key));
  });
};
