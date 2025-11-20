// Performance monitoring service for blockchain explorer
import React from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHits: number;
  cacheMisses: number;
  errorCount: number;
  userInteractions: number;
}

export interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  threshold?: number;
  currentValue?: number;
  timestamp: Date;
  component?: string;
}

export interface PerformanceOptions {
  enableTracking?: boolean;
  sampleRate?: number; // Percentage of operations to track
  alertThresholds?: {
    renderTime?: number; // ms
    memoryUsage?: number; // MB
    errorRate?: number; // percentage
    cacheHitRate?: number; // percentage
  };
  enableConsoleLogging?: boolean;
  enableReporting?: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    componentCount: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errorCount: 0,
    userInteractions: 0,
  };

  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private renderStartTimes = new Map<string, number>();
  private isEnabled = false;
  private options: PerformanceOptions;

  constructor(options: PerformanceOptions = {}) {
    this.options = {
      enableTracking: true,
      sampleRate: 100,
      alertThresholds: {
        renderTime: 100, // 100ms
        memoryUsage: 100, // 100MB
        errorRate: 5, // 5%
        cacheHitRate: 80, // 80%
      },
      enableConsoleLogging: true,
      enableReporting: false,
      ...options,
    };

    // Only enable tracking on client-side
    if (this.options.enableTracking && this.shouldSample() && this.isClientSide()) {
      this.enableTracking();
    }
  }

  // Check if we're on client-side
  private isClientSide(): boolean {
    return typeof window !== 'undefined' && typeof window.fetch !== 'undefined';
  }

  // Enable performance tracking
  enableTracking(): void {
    if (this.isEnabled || !this.isClientSide()) return;

    this.isEnabled = true;
    this.setupObservers();
    this.startMemoryTracking();
    this.startNetworkTracking();
    this.logPerformance('Performance tracking enabled');
  }

  // Disable performance tracking
  disableTracking(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    this.cleanup();
    this.logPerformance('Performance tracking disabled');
  }

  // Track component render time
  trackRenderStart(componentName: string): string {
    if (!this.shouldSample()) return '';

    const renderId = `${componentName}-${Date.now()}-${Math.random()}`;
    this.renderStartTimes.set(renderId, performance.now());
    return renderId;
  }

  trackRenderEnd(renderId: string, componentName: string): void {
    if (!this.shouldSample() || !renderId) return;

    const startTime = this.renderStartTimes.get(renderId);
    if (!startTime) return;

    const renderTime = performance.now() - startTime;
    this.metrics.renderTime = (this.metrics.renderTime + renderTime) / 2;
    this.renderStartTimes.delete(renderId);

    // Check threshold
    if (this.options.alertThresholds?.renderTime && renderTime > this.options.alertThresholds.renderTime) {
      this.addAlert({
        type: 'warning',
        message: `Slow render detected for ${componentName}`,
        threshold: this.options.alertThresholds.renderTime,
        currentValue: renderTime,
        timestamp: new Date(),
        component: componentName,
      });
    }

    this.logPerformance(`Render time for ${componentName}: ${renderTime.toFixed(2)}ms`);
  }

  // Track component mount
  trackComponentMount(componentName: string): void {
    if (!this.shouldSample()) return;

    this.metrics.componentCount++;
    this.logPerformance(`Component mounted: ${componentName}`);
  }

  // Track component unmount
  trackComponentUnmount(componentName: string): void {
    if (!this.shouldSample()) return;

    this.metrics.componentCount = Math.max(0, this.metrics.componentCount - 1);
    this.logPerformance(`Component unmounted: ${componentName}`);
  }

  // Track user interaction
  trackUserInteraction(action: string, element?: string): void {
    if (!this.shouldSample()) return;

    this.metrics.userInteractions++;
    this.logPerformance(`User interaction: ${action} on ${element || 'unknown'}`);
  }

  // Track network request
  trackNetworkRequest(url: string, method: string, duration: number): void {
    if (!this.shouldSample()) return;

    this.metrics.networkRequests++;
    this.logPerformance(`Network request: ${method} ${url} - ${duration.toFixed(2)}ms`);
  }

  // Track cache hit
  trackCacheHit(key: string): void {
    if (!this.shouldSample()) return;

    this.metrics.cacheHits++;
    this.logPerformance(`Cache hit: ${key}`);
  }

  // Track cache miss
  trackCacheMiss(key: string): void {
    if (!this.shouldSample()) return;

    this.metrics.cacheMisses++;
    this.logPerformance(`Cache miss: ${key}`);
  }

  // Track error
  trackError(error: Error, context?: string): void {
    if (!this.shouldSample()) return;

    this.metrics.errorCount++;
    this.addAlert({
      type: 'error',
      message: `${error.message}${context ? ` in ${context}` : ''}`,
      timestamp: new Date(),
      component: context,
    });
    this.logPerformance(`Error tracked: ${error.message}`);
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  // Get performance alerts
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  // Clear alerts
  clearAlerts(): void {
    this.alerts = [];
  }

  // Check if operation should be sampled
  private shouldSample(): boolean {
    return Math.random() * 100 < (this.options.sampleRate || 100);
  }

  // Setup performance observers
  private setupObservers(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      // Observer for render performance
      const renderObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'measure' && entry.name.includes('render')) {
            this.metrics.renderTime = (this.metrics.renderTime + entry.duration) / 2;
          }
        });
      });

      renderObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(renderObserver);

      // Observer for navigation timing
      const navigationObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.logPerformance(`Page load time: ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    }
  }

  // Start memory tracking
  private startMemoryTracking(): void {
    if ('memory' in performance) {
      setInterval(() => {
        this.updateMemoryUsage();
      }, 5000); // Update every 5 seconds
    }
  }

  // Update memory usage
  private updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryMB = memory.usedJSHeapSize / (1024 * 1024);
      this.metrics.memoryUsage = memoryMB;

      // Check threshold
      if (this.options.alertThresholds?.memoryUsage && memoryMB > this.options.alertThresholds.memoryUsage) {
        this.addAlert({
          type: 'warning',
          message: `High memory usage detected`,
          threshold: this.options.alertThresholds.memoryUsage,
          currentValue: memoryMB,
          timestamp: new Date(),
        });
      }
    }
  }

  // Start network tracking
  private startNetworkTracking(): void {
    // Only override fetch on client-side
    if (!this.isClientSide()) return;

    // Override fetch to track requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      const url = args[0] as string;
      const options = args[1] as RequestInit;

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        this.trackNetworkRequest(url, options?.method || 'GET', duration);
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        this.trackNetworkRequest(url, options?.method || 'GET', duration);
        throw error;
      }
    };
  }

  // Add performance alert
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.unshift(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }

    // Log to console if enabled
    if (this.options.enableConsoleLogging) {
      console.warn(`[Performance Alert] ${alert.type}: ${alert.message}`);
    }
  }

  // Log performance information
  private logPerformance(message: string): void {
    if (this.options.enableConsoleLogging) {
      console.log(`[Performance] ${message}`);
    }
  }

  // Cleanup observers
  private cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance with SSR protection
export const performanceMonitor = new PerformanceMonitor();

// React hooks for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderRef = React.useRef<string>('');

  React.useEffect(() => {
    // Track component mount
    performanceMonitor.trackComponentMount(componentName);

    return () => {
      // Track component unmount
      performanceMonitor.trackComponentUnmount(componentName);
    };
  }, [componentName]);

  // Track render start
  React.useLayoutEffect(() => {
    renderRef.current = performanceMonitor.trackRenderStart(componentName);
  });

  // Track render end
  React.useLayoutEffect(() => {
    if (renderRef.current) {
      performanceMonitor.trackRenderEnd(renderRef.current, componentName);
    }
  });

  // Track user interactions
  const trackInteraction = React.useCallback((action: string, element?: string) => {
    performanceMonitor.trackUserInteraction(action, element);
  }, []);

  return {
    trackInteraction,
    getMetrics: () => performanceMonitor.getMetrics(),
    getAlerts: () => performanceMonitor.getAlerts(),
  };
}

// Higher-order component for performance tracking
export function withPerformanceTracking<P extends object>(Component: React.ComponentType<P>, componentName?: string) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    const { trackInteraction } = usePerformanceMonitor(name);

    // Wrap event handlers to track interactions
    const trackedProps = { ...props };
    Object.keys(trackedProps).forEach(key => {
      const prop = trackedProps[key as keyof P];
      if (typeof prop === 'function' && key.startsWith('on')) {
        trackedProps[key as keyof P] = ((...args: any[]) => {
          trackInteraction(key, name);
          return (prop as Function).apply(null, args);
        }) as any;
      }
    });

    return <Component {...trackedProps} ref={ref} />;
  });

  WrappedComponent.displayName = `withPerformanceTracking(${componentName || Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Performance utilities
export function measurePerformance<T>(name: string, fn: () => T, track = true): T {
  if (!track) return fn();

  const start = performance.now();
  const result = fn();
  const end = performance.now();

  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

export function createPerformanceReport(): string {
  const metrics = performanceMonitor.getMetrics();
  const alerts = performanceMonitor.getAlerts();

  const cacheHitRate =
    metrics.cacheHits + metrics.cacheMisses > 0
      ? ((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(2)
      : 'N/A';

  const recentAlerts = alerts
    .slice(0, 5)
    .map(
      (alert: PerformanceAlert) => `- ${alert.type.toUpperCase()}: ${alert.message} (${alert.timestamp.toISOString()})`,
    )
    .join('\n');

  const report = `Performance Report - ${new Date().toISOString()}

Metrics:
- Render Time: ${metrics.renderTime.toFixed(2)}ms
- Component Count: ${metrics.componentCount}
- Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB
- Network Requests: ${metrics.networkRequests}
- Cache Hits: ${metrics.cacheHits}
- Cache Misses: ${metrics.cacheMisses}
- Error Count: ${metrics.errorCount}
- User Interactions: ${metrics.userInteractions}

Cache Hit Rate: ${cacheHitRate}%

Recent Alerts:
${recentAlerts}

---
  `;

  return report.trim();
}
