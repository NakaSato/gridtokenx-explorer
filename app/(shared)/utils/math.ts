/**
 * Math and Number Utilities
 * Consolidated functions for mathematical operations and number formatting
 */

/**
 * Calculate a percentage using bigints, as numerator/denominator * 100
 * @param numerator - The numerator value
 * @param denominator - The denominator value
 * @param decimals - Number of decimal places
 * @returns A percentage with the requested number of decimal places
 */
export function percentage(numerator: bigint, denominator: bigint, decimals: number): number {
  const pow = 10 ** decimals;
  try {
    return Number((numerator * BigInt(100 * pow)) / denominator) / pow;
  } catch (error) {
    console.error('Error calculating percentage', error);
    return 0;
  }
}

// Constants for SOL calculations
export const LAMPORTS_PER_SOL = 1000000000n;

/**
 * Convert lamports to SOL (number)
 * @param lamports - Amount in lamports
 * @returns Amount in SOL
 */
export function lamportsToSol(lamports: number | bigint): number {
  return Number(lamports) / Number(LAMPORTS_PER_SOL);
}

/**
 * Convert lamports to SOL (string with formatting)
 * @param lamports - Amount in lamports
 * @param maximumFractionDigits - Maximum fraction digits for formatting
 * @returns Formatted SOL amount string
 */
export function lamportsToSolString(lamports: number | bigint, maximumFractionDigits = 9): string {
  const sol = lamportsToSol(lamports);
  return sol.toLocaleString('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  });
}

/**
 * Format lamports as SOL with abbreviated notation (K, M, B, T)
 * @param lamports - Amount in lamports
 * @returns Abbreviated SOL amount string
 */
export function abbreviatedLamportsToSol(lamports: number | bigint): string {
  const sol = lamportsToSol(lamports);
  if (sol === 0) return '0';

  const abbreviations = ['', 'K', 'M', 'B', 'T'];
  const absSol = Math.abs(sol);
  const abbreviationIndex = Math.floor(Math.log10(absSol) / 3);
  const abbreviatedValue = sol / Math.pow(1000, abbreviationIndex);

  return `${abbreviatedValue.toFixed(abbreviationIndex > 0 ? 1 : 0)}${abbreviations[abbreviationIndex]}`;
}

/**
 * Format a number with abbreviated notation (K, M, B, T)
 * @param value - The number to abbreviate
 * @returns Abbreviated number string
 */
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

// String formatting utilities

/**
 * Convert camelCase string to Title Case
 * @param str - camelCase string
 * @returns Title Case string
 */
export function camelToTitleCase(str: string): string {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

/**
 * Convert snake_case string to Title Case
 * @param str - snake_case string
 * @returns Title Case string
 */
export function snakeToTitleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Add thousand separators to number string
 * @param value - Number string
 * @returns Formatted string with comma separators
 */
export function numberWithSeparator(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Convert slots to human-readable time string
 * @param slots - Number of slots
 * @param slotTimeMs - Time per slot in milliseconds
 * @returns Human-readable time string
 */
export function slotsToHumanString(slots: number, slotTimeMs: number): string {
  const totalMs = slots * slotTimeMs;
  const totalSeconds = Math.floor(totalMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 0) {
    return `${totalDays}d ${totalHours % 24}h`;
  } else if (totalHours > 0) {
    return `${totalHours}h ${totalMinutes % 60}m`;
  } else if (totalMinutes > 0) {
    return `${totalMinutes}m ${totalSeconds % 60}s`;
  } else {
    return `${totalSeconds}s`;
  }
}

/**
 * Normalize token amount by dividing by 10^decimals
 * @param amount - Token amount (number or bigint)
 * @param decimals - Number of decimals for the token
 * @returns Normalized amount
 */
export function normalizeTokenAmount(amount: number | bigint, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals);
}
