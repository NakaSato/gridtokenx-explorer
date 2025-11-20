/**
 * Calculate a percentage using bigints, as numerator/denominator * 100
 * @returns a percentage, with the requested number of decimal places
 */
export function percentage(numerator: bigint, denominator: bigint, decimals: number): number {
  // since bigint is integer, we need to multiply first to get decimals
  // see https://stackoverflow.com/a/63095380/1375972
  const pow = 10 ** decimals;
  try {
    return Number((numerator * BigInt(100 * pow)) / denominator) / pow;
  } catch (e) {
    console.error('Error calculating percentage', e);
    return 0;
  }
}

// Constants for SOL calculations
export const LAMPORTS_PER_SOL = 1000000000n;

/**
 * Convert lamports to SOL (number)
 */
export function lamportsToSol(lamports: number | bigint): number {
  return Number(lamports) / Number(LAMPORTS_PER_SOL);
}

/**
 * Convert lamports to SOL (string with formatting)
 */
export function lamportsToSolString(lamports: number | bigint, maximumFractionDigits = 9): string {
  const sol = lamportsToSol(lamports);
  return sol.toLocaleString('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  });
}

/**
 * Format lamports as SOL with abbreviated number
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

// String formatting utilities
export function camelToTitleCase(str: string): string {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

export function snakeToTitleCase(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export function numberWithSeparator(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
