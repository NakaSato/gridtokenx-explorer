import { PublicKey } from '@solana/web3.js';

import {
  decodeMarket,
  decodeOrder,
  decodeTradeRecord,
  MARKET_ACCOUNT_SIZE,
  ORDER_ACCOUNT_SIZE,
  TRADE_RECORD_ACCOUNT_SIZE,
} from '../trading-decoders';

// Fixtures are built field-by-field at the offsets defined by the #[repr(C)]
// structs in gridtokenx-anchor/programs/trading/src/state/. If a decoder
// offset drifts from the Rust layout, these specs fail.

const AUTHORITY = new PublicKey('4HB6s1bAiAPk8kxSatGd3U7bKArXXSoDfemfu23UZBdw');
const SELLER = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const BUYER = new PublicKey('So11111111111111111111111111111111111111112');
const SELL_ORDER = new PublicKey('SysvarRent111111111111111111111111111111111');
const BUY_ORDER = new PublicKey('SysvarC1ock11111111111111111111111111111111');

const DISCRIMINATOR = 8;

function buildOrderAccount(): Buffer {
  const buf = Buffer.alloc(ORDER_ACCOUNT_SIZE);
  const d = buf.subarray(DISCRIMINATOR);
  SELLER.toBuffer().copy(d, 0); // seller: Pubkey        @0
  BUYER.toBuffer().copy(d, 32); // buyer: Pubkey         @32
  d.writeBigUInt64LE(42n, 64); // order_id: u64          @64
  d.writeBigUInt64LE(1_500n, 72); // amount: u64         @72
  d.writeBigUInt64LE(500n, 80); // filled_amount: u64    @80
  d.writeBigUInt64LE(4_250n, 88); // price_per_kwh: u64  @88
  d[96] = 0; // order_type: u8 (Sell)                    @96
  d[97] = 1; // status: u8 (PartiallyFilled)             @97
  // _padding: [u8; 6]                                   @98
  d.writeBigInt64LE(1_750_000_000n, 104); // created_at  @104
  d.writeBigInt64LE(1_750_003_600n, 112); // expires_at  @112
  return buf;
}

describe('decodeOrder', () => {
  it('decodes every field at the repr(C) offsets', () => {
    const order = decodeOrder(buildOrderAccount(), 'orderAddr');

    expect(order).toEqual({
      address: 'orderAddr',
      seller: SELLER.toBase58(),
      buyer: BUYER.toBase58(),
      orderId: 42,
      amount: 1500,
      filledAmount: 500,
      pricePerKwh: 4250,
      orderType: 'Sell',
      status: 'PartiallyFilled',
      createdAt: 1_750_000_000,
      expiresAt: 1_750_003_600,
    });
  });

  it('maps the Buy discriminant and unknown values', () => {
    const buf = buildOrderAccount();
    buf[DISCRIMINATOR + 96] = 1;
    buf[DISCRIMINATOR + 97] = 9;
    const order = decodeOrder(buf, 'orderAddr');
    expect(order.orderType).toBe('Buy');
    expect(order.status).toBe('Unknown(9)');
  });
});

describe('decodeMarket', () => {
  it('decodes every field at the repr(C) offsets', () => {
    const buf = Buffer.alloc(MARKET_ACCOUNT_SIZE);
    const d = buf.subarray(DISCRIMINATOR);
    AUTHORITY.toBuffer().copy(d, 0); // authority          @0
    d.writeBigUInt64LE(9_000n, 32); // total_volume        @32
    d.writeBigInt64LE(1_749_999_999n, 40); // created_at   @40
    d.writeBigUInt64LE(4_100n, 48); // last_clearing_price @48
    d.writeBigUInt64LE(4_050n, 56); // volume_weighted     @56
    d.writeUInt32LE(7, 64); // active_orders               @64
    d.writeUInt32LE(19, 68); // total_trades               @68
    d.writeUInt16LE(25, 72); // market_fee_bps             @72
    d[74] = 1; // clearing_enabled                         @74
    d[75] = 0; // _reserved_guard — must NOT be read       @75
    d.writeBigUInt64LE(1n, 80); // min_price_per_kwh       @80
    d.writeBigUInt64LE(99_999n, 88); // max_price_per_kwh  @88
    d[2158] = 12; // price_history_count                   @2158

    const market = decodeMarket(buf, 'marketAddr');

    expect(market).toEqual({
      address: 'marketAddr',
      authority: AUTHORITY.toBase58(),
      totalVolume: 9000,
      lastClearingPrice: 4100,
      vwap: 4050,
      activeOrders: 7,
      totalTrades: 19,
      marketFeeBps: 25,
      clearingEnabled: true,
      minPrice: 1,
      maxPrice: 99999,
      buyDepthCount: 0,
      sellDepthCount: 0,
      priceHistoryCount: 12,
    });
  });

  it('reads clearing_enabled at offset 74, not the reserved byte at 75', () => {
    const buf = Buffer.alloc(MARKET_ACCOUNT_SIZE);
    AUTHORITY.toBuffer().copy(buf, DISCRIMINATOR);
    buf[DISCRIMINATOR + 74] = 0; // clearing disabled
    buf[DISCRIMINATOR + 75] = 1; // reserved byte set — decoder must ignore
    expect(decodeMarket(buf, 'marketAddr').clearingEnabled).toBe(false);
  });
});

describe('decodeTradeRecord', () => {
  it('decodes every field at the repr(C) offsets', () => {
    const buf = Buffer.alloc(TRADE_RECORD_ACCOUNT_SIZE);
    const d = buf.subarray(DISCRIMINATOR);
    SELL_ORDER.toBuffer().copy(d, 0); // sell_order        @0
    BUY_ORDER.toBuffer().copy(d, 32); // buy_order         @32
    SELLER.toBuffer().copy(d, 64); // seller               @64
    BUYER.toBuffer().copy(d, 96); // buyer                 @96
    d.writeBigUInt64LE(800n, 128); // amount               @128
    d.writeBigUInt64LE(4_300n, 136); // price_per_kwh      @136
    d.writeBigUInt64LE(3_440_000n, 144); // total_value    @144
    d.writeBigUInt64LE(8_600n, 152); // fee_amount         @152
    d.writeBigInt64LE(1_750_001_234n, 160); // executed_at @160

    const trade = decodeTradeRecord(buf, 'tradeAddr');

    expect(trade).toEqual({
      address: 'tradeAddr',
      sellOrder: SELL_ORDER.toBase58(),
      buyOrder: BUY_ORDER.toBase58(),
      seller: SELLER.toBase58(),
      buyer: BUYER.toBase58(),
      amount: 800,
      pricePerKwh: 4300,
      totalValue: 3440000,
      feeAmount: 8600,
      executedAt: 1_750_001_234,
    });
  });
});
