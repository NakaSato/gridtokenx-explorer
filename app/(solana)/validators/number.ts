import { bigint, coerce, number, string, union } from 'superstruct';

export const BigIntFromString = coerce(bigint(), string(), (value): bigint => {
  if (typeof value === 'string') return BigInt(value);
  throw new Error('invalid bigint');
});

export const NumberFromString = coerce(number(), string(), (value): number => {
  if (typeof value === 'string') return Number(value);
  throw new Error('invalid number');
});

// RPC returns u64 fields (lamports, space) as bigint under web3.js v2 / newer
// RPC clients; older ones send number or string. Coerce all to number.
export const NumberFromBig = coerce(number(), union([bigint(), string()]), (value): number => {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return Number(value);
  throw new Error('invalid number');
});
