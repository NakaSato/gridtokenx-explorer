// Shared Utilities Barrel Export
// Export all shared utilities for clean imports

// Type definitions
export type SignatureProps = {
  signature: string;
};

// Core utility functions
export function abbreviatedNumber(value: number): string {
  if (value === 0) return '0';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(2)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(2)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(2)}K`;
  } else {
    return `${sign}${absValue.toFixed(2)}`;
  }
}

// Core utilities (these will be populated as we organize utils)
export * from './anchor';
export * from './ans-domains';
export * from './attestation-service';
export * from './cluster';
export * from './coingecko';
export * from './compute-units-schedule';
export * from './convertLegacyIdl';
export * from './date';
export * from './domain-info';
export * from './env';
export * from './epoch-schedule';
export * from './get-instruction-card-scroll-anchor-id';
export * from './get-readable-title-from-address';
export * from './instruction';
export * from './kit-wrapper';
export * from './local-storage';
export * from './logger';
export * from './math';
export * from './name-service';
export * from './parseFeatureAccount';
export * from './program-err';
export * from './program-ids';
export * from './program-logs';
export * from './program-name';
export * from './program-verification';
export * from './programs';
export * from './rpc';
export * from './serumMarketRegistry';
export * from './token-extension';
export * from './token-info';
export * from './token-search';
export * from './tx';
export * from './url';
export * from './use-debounce-async';
export * from './use-tab-visibility';
export * from './verified-builds';

// Feature gate utilities
export * from './feature-gate/types';
export * from './feature-gate/utils';
export { UpcomingFeatures } from './feature-gate/UpcomingFeatures';

// UI utilities
export * from './cn';
