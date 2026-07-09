/**
 * Display scaling for the trading program's on-chain integers.
 *
 * Energy amounts carry 9 decimals (ENERGY_AMOUNT_DECIMALS_DIVISOR = 1e9 in
 * gridtokenx-anchor/programs/trading/src/lib.rs) → kWh. Prices and currency
 * values (price_per_kwh, total_value, fee_amount) are 6-decimal micro-THB
 * (settlement currency, THBG) → THB. Decoders return the raw u64s untouched
 * (see trading-decoders.ts, fixture-tested); scale here at the presentation
 * boundary only.
 */
export const ENERGY_DECIMALS = 9;
export const PRICE_DECIMALS = 6;

export const toKwh = (raw: number): number => raw / 10 ** ENERGY_DECIMALS;
export const toThb = (raw: number): number => raw / 10 ** PRICE_DECIMALS;

/** kWh, up to 3 fractional digits. */
export const fmtKwh = (raw: number): string =>
  toKwh(raw).toLocaleString(undefined, { maximumFractionDigits: 3 });

/** THB, up to 2 fractional digits. */
export const fmtThb = (raw: number): string =>
  toThb(raw).toLocaleString(undefined, { maximumFractionDigits: 2 });
