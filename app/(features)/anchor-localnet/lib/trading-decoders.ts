/**
 * Pure decoders for the trading program's zero-copy accounts.
 *
 * Offsets mirror the #[repr(C)] structs in
 * gridtokenx-anchor/programs/trading/src/state/{market,order}.rs — every
 * account is 8-byte discriminator + payload. Sizes and offsets are covered by
 * fixture tests in __tests__/trading-decoders.spec.ts; if the on-chain layout
 * changes, update both together.
 */
import { PublicKey } from '@solana/web3.js';

import type { MarketData, OrderData, TradeData } from '../hooks/useTradingExplorerData';

export const MARKET_ACCOUNT_SIZE = 2760;
export const ORDER_ACCOUNT_SIZE = 128;
export const TRADE_RECORD_ACCOUNT_SIZE = 176;
export const ZONE_MARKET_ACCOUNT_SIZE = 576;

export interface PriceLevelData {
  price: number;
  totalAmount: number;
  orderCount: number;
}

export interface ZoneMarketData {
  address: string;
  market: string;
  zoneId: number;
  numShards: number;
  totalVolume: number;
  activeOrders: number;
  totalTrades: number;
  lastClearingPrice: number;
  capacity: number;
  committedFlow: number;
  buyDepth: PriceLevelData[];
  sellDepth: PriceLevelData[];
}

// Rust: enum OrderType { Sell, Buy } — Sell is discriminant 0.
const ORDER_TYPES: Record<number, string> = { 0: 'Sell', 1: 'Buy' };
const ORDER_STATUSES: Record<number, string> = {
  0: 'Active',
  1: 'PartiallyFilled',
  2: 'Completed',
  3: 'Cancelled',
  4: 'Expired',
};

/** Market payload (state/market.rs): authority@0, total_volume@32, created_at@40,
 * last_clearing_price@48, vwap@56, active_orders@64, total_trades@68,
 * market_fee_bps@72, clearing_enabled@74, min@80, max@88, price_history_count@2158. */
export function decodeMarket(data: Buffer, address: string): MarketData {
  const d = data.subarray(8);
  return {
    address,
    authority: new PublicKey(d.subarray(0, 32)).toBase58(),
    totalVolume: Number(d.readBigUInt64LE(32)),
    lastClearingPrice: Number(d.readBigUInt64LE(48)),
    vwap: Number(d.readBigUInt64LE(56)),
    activeOrders: d.readUInt32LE(64),
    totalTrades: d.readUInt32LE(68),
    marketFeeBps: d.readUInt16LE(72),
    clearingEnabled: d[74] === 1,
    minPrice: Number(d.readBigUInt64LE(80)),
    maxPrice: Number(d.readBigUInt64LE(88)),
    buyDepthCount: 0,
    sellDepthCount: 0,
    priceHistoryCount: d[2158],
  };
}

/** Order payload (state/order.rs): seller@0, buyer@32, order_id@64, amount@72,
 * filled_amount@80, price_per_kwh@88, order_type@96, status@97, _padding@98,
 * created_at@104, expires_at@112. */
export function decodeOrder(data: Buffer, address: string): OrderData {
  const d = data.subarray(8);
  const orderType = d[96];
  const status = d[97];
  return {
    address,
    seller: new PublicKey(d.subarray(0, 32)).toBase58(),
    buyer: new PublicKey(d.subarray(32, 64)).toBase58(),
    orderId: Number(d.readBigUInt64LE(64)),
    amount: Number(d.readBigUInt64LE(72)),
    filledAmount: Number(d.readBigUInt64LE(80)),
    pricePerKwh: Number(d.readBigUInt64LE(88)),
    orderType: ORDER_TYPES[orderType] ?? `Unknown(${orderType})`,
    status: ORDER_STATUSES[status] ?? `Unknown(${status})`,
    createdAt: Number(d.readBigInt64LE(104)),
    expiresAt: Number(d.readBigInt64LE(112)),
  };
}

const PRICE_LEVEL_SIZE = 24; // PriceLevel: price u64 + total_amount u64 + order_count u16 + pad 6
const MAX_DEPTH_LEVELS = 10;

function decodeDepth(d: Buffer, base: number, count: number): PriceLevelData[] {
  const levels: PriceLevelData[] = [];
  for (let i = 0; i < Math.min(count, MAX_DEPTH_LEVELS); i++) {
    const at = base + i * PRICE_LEVEL_SIZE;
    levels.push({
      orderCount: d.readUInt16LE(at + 16),
      price: Number(d.readBigUInt64LE(at)),
      totalAmount: Number(d.readBigUInt64LE(at + 8)),
    });
  }
  return levels;
}

/** ZoneMarket payload (state/zone_market.rs): market@0, zone_id@32, num_shards@36,
 * total_volume@40, active_orders@48, total_trades@52, buy_depth_count@56,
 * sell_depth_count@57, last_clearing_price@64, capacity@72, committed_flow@80,
 * buy_side_depth@88, sell_side_depth@328 (each 10 × 24-byte PriceLevel). */
export function decodeZoneMarket(data: Buffer, address: string): ZoneMarketData {
  const d = data.subarray(8);
  const buyDepthCount = d[56];
  const sellDepthCount = d[57];
  return {
    address,
    market: new PublicKey(d.subarray(0, 32)).toBase58(),
    zoneId: d.readUInt32LE(32),
    numShards: d[36],
    totalVolume: Number(d.readBigUInt64LE(40)),
    activeOrders: d.readUInt32LE(48),
    totalTrades: d.readUInt32LE(52),
    lastClearingPrice: Number(d.readBigUInt64LE(64)),
    capacity: Number(d.readBigUInt64LE(72)),
    committedFlow: Number(d.readBigUInt64LE(80)),
    buyDepth: decodeDepth(d, 88, buyDepthCount),
    sellDepth: decodeDepth(d, 328, sellDepthCount),
  };
}

/** TradeRecord payload (state/order.rs): sell_order@0, buy_order@32, seller@64,
 * buyer@96, amount@128, price_per_kwh@136, total_value@144, fee_amount@152,
 * executed_at@160. */
export function decodeTradeRecord(data: Buffer, address: string): TradeData {
  const d = data.subarray(8);
  return {
    address,
    sellOrder: new PublicKey(d.subarray(0, 32)).toBase58(),
    buyOrder: new PublicKey(d.subarray(32, 64)).toBase58(),
    seller: new PublicKey(d.subarray(64, 96)).toBase58(),
    buyer: new PublicKey(d.subarray(96, 128)).toBase58(),
    amount: Number(d.readBigUInt64LE(128)),
    pricePerKwh: Number(d.readBigUInt64LE(136)),
    totalValue: Number(d.readBigUInt64LE(144)),
    feeAmount: Number(d.readBigUInt64LE(152)),
    executedAt: Number(d.readBigInt64LE(160)),
  };
}
