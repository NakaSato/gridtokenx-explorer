'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  History,
  ListFilter,
  Wifi,
  WifiOff,
  Loader2,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import { cn } from '@/app/(shared)/utils/cn';

interface TradingTerminalProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface PricePoint {
  price: number;
  volume: number;
  time: number;
}

interface Market {
  address: string;
  totalVolume: number;
  lastPrice: number;
  vwap: number;
  activeOrders: number;
  totalTrades: number;
  feeBps: number;
  priceHistory: PricePoint[];
}

interface Level {
  price: number;
  amount: number;
}

interface Trade {
  address: string;
  amount: number;
  price: number;
  time: number;
}

// On-chain account sizes (incl. 8-byte Anchor discriminator) — see trading
// program state structs. Market holds the global stats + price-history ring;
// the live order book lives in each ZoneMarket's buy/sell depth arrays.
const SIZE = { market: 2760, zoneMarket: 576, order: 128, trade: 176 };
const PRICE_LEVEL = 24; // PriceLevel: price u64, total_amount u64, order_count u16, pad
const DEPTH_LEN = 10;
const BUY_DEPTH_OFF = 88; // zone payload offset of buy_side_depth (abs 96 − 8 disc)
const SELL_DEPTH_OFF = 328; // sell_side_depth (abs 336 − 8 disc)

const u64 = (d: Buffer, o: number) => Number(d.readBigUInt64LE(o));
const i64 = (d: Buffer, o: number) => Number(d.readBigInt64LE(o));

function readDepth(d: Buffer, base: number, into: Map<number, number>) {
  for (let i = 0; i < DEPTH_LEN; i++) {
    const o = base + i * PRICE_LEVEL;
    if (o + 16 > d.length) break;
    const price = u64(d, o);
    const amount = u64(d, o + 8);
    if (price > 0 && amount > 0) into.set(price, (into.get(price) ?? 0) + amount);
  }
}

export function TradingTerminal({ rpcUrl, getConnection }: TradingTerminalProps) {
  const [market, setMarket] = useState<Market | null>(null);
  const [bids, setBids] = useState<Level[]>([]);
  const [asks, setAsks] = useState<Level[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [zoneCount, setZoneCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchTradingData = useCallback(async () => {
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.trading.id);
      const accounts = await conn.getProgramAccounts(programId);

      let marketData: Market | null = null;
      const tradeList: Trade[] = [];
      const bidMap = new Map<number, number>();
      const askMap = new Map<number, number>();
      let zones = 0;

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        const d = data.subarray(8) as Buffer;

        if (data.length === SIZE.market) {
          marketData = {
            address: pubkey.toBase58(),
            totalVolume: u64(d, 32),
            lastPrice: u64(d, 48), // last_clearing_price
            vwap: u64(d, 56),
            activeOrders: d.readUInt32LE(64),
            totalTrades: d.readUInt32LE(68),
            feeBps: d.readUInt16LE(72),
            priceHistory: Array.from({ length: 24 })
              .map((_, i) => {
                const start = 2160 + i * PRICE_LEVEL; // price_history ring, payload offset
                if (start + 24 > d.length) return null;
                return { price: u64(d, start), volume: u64(d, start + 8), time: i64(d, start + 16) };
              })
              .filter((ph): ph is PricePoint => !!ph && ph.time > 0)
              .sort((a, b) => a.time - b.time),
          };
        } else if (data.length === SIZE.zoneMarket) {
          // Live order book — aggregate every zone's depth ladder.
          zones++;
          readDepth(d, BUY_DEPTH_OFF, bidMap);
          readDepth(d, SELL_DEPTH_OFF, askMap);
        } else if (data.length === SIZE.order) {
          // Standalone Order accounts (when the CDA rests them individually).
          const status = d[97];
          if (status > 1) continue; // only Active / PartiallyFilled stay on the book
          const remaining = u64(d, 72) - u64(d, 80); // amount − filled
          if (remaining <= 0) continue;
          const price = u64(d, 88);
          const map = d[96] === 1 ? bidMap : askMap; // OrderType: 1 = Buy, 0 = Sell
          if (price > 0) map.set(price, (map.get(price) ?? 0) + remaining);
        } else if (data.length === SIZE.trade) {
          tradeList.push({
            address: pubkey.toBase58(),
            amount: u64(d, 128),
            price: u64(d, 136),
            time: i64(d, 160),
          });
        }
      }

      const toLevels = (m: Map<number, number>) => Array.from(m, ([price, amount]) => ({ price, amount }));
      setMarket(marketData);
      setBids(toLevels(bidMap).sort((a, b) => b.price - a.price));
      setAsks(toLevels(askMap).sort((a, b) => a.price - b.price));
      setTrades(tradeList.sort((a, b) => b.time - a.time));
      setZoneCount(zones);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error('TradingTerminal fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reach RPC endpoint');
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    setIsLoading(true);
    fetchTradingData();
    const interval = setInterval(fetchTradingData, 3000);
    return () => clearInterval(interval);
  }, [fetchTradingData]);

  // Real depth scaling — relative to the largest resting order in the book.
  const maxBookAmount = useMemo(
    () => Math.max(1, ...bids.map((o) => o.amount), ...asks.map((o) => o.amount)),
    [bids, asks],
  );

  const spread = asks[0] && bids[0] ? asks[0].price - bids[0].price : null;

  // Real price series: prefer the market's on-chain price-history ring; if the
  // market hasn't recorded one yet, fall back to executed trades (also real,
  // straight from TradeRecord accounts), oldest → newest.
  const series = useMemo<PricePoint[]>(() => {
    const h = market?.priceHistory ?? [];
    if (h.length > 0) return h;
    return [...trades]
      .filter((t) => t.time > 0 && t.price > 0)
      .sort((a, b) => a.time - b.time)
      .map((t) => ({ price: t.price, volume: t.amount, time: t.time }));
  }, [market, trades]);

  // Display values, each backed by whichever real source is populated.
  const lastPrice = market?.lastPrice || series[series.length - 1]?.price || 0;
  const totalVolume = market?.totalVolume || trades.reduce((s, t) => s + t.amount, 0);
  const totalTrades = market?.totalTrades || trades.length;

  const priceChangePct = useMemo(() => {
    if (series.length < 2) return null;
    const first = series[0].price;
    const last = series[series.length - 1].price;
    if (!first) return null;
    return ((last - first) / first) * 100;
  }, [series]);

  const chartData = useMemo(
    () =>
      series.map((p) => ({
        label: new Date(p.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: p.price,
        volume: p.volume,
      })),
    [series],
  );

  const isConnected = !error;
  const rpcHost = useMemo(() => {
    try {
      return new URL(rpcUrl).host;
    } catch {
      return rpcUrl;
    }
  }, [rpcUrl]);

  // First-load skeleton — only before we have any data at all.
  if (isLoading && !market && bids.length === 0 && asks.length === 0 && !error) {
    return (
      <div className="flex h-[800px] flex-col items-center justify-center gap-3 bg-background/50 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Connecting to {rpcHost}…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Connection status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/40 px-4 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">{rpcHost}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>
            <span className="font-bold text-foreground">{market?.activeOrders ?? 0}</span> active orders
          </span>
          <span>
            <span className="font-bold text-foreground">{zoneCount}</span> zones
          </span>
          <span>
            <span className="font-bold text-foreground">{trades.length}</span> trades
          </span>
          {lastUpdated && <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            RPC error: {error}. Ensure a validator is running at{' '}
            <span className="font-mono">{rpcHost}</span>. Retrying every 3s…
          </span>
        </div>
      )}

      <div className="grid h-[800px] grid-cols-12 gap-4 bg-background/50 p-2">
        {/* Left: Order Book (3 cols) */}
        <Card className="col-span-12 flex flex-col border-border/60 bg-card/40 backdrop-blur-md lg:col-span-3">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <ListFilter className="h-3.5 w-3.5 text-primary" /> Order Book
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            <div className="grid grid-cols-3 border-b bg-muted/20 px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground">
              <span>Price</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Total</span>
            </div>

            {bids.length === 0 && asks.length === 0 ? (
              <EmptyState label="No resting orders" />
            ) : (
              <>
                {/* Asks (Sells) - Red */}
                <div className="flex flex-1 flex-col-reverse overflow-y-auto">
                  {asks.slice(0, 15).reverse().map((order) => (
                    <OrderBookRow
                      key={order.address}
                      price={order.price}
                      amount={order.amount}
                      type="sell"
                      maxAmount={maxBookAmount}
                    />
                  ))}
                </div>

                {/* Spread */}
                <div className="flex items-center justify-between border-y bg-muted/30 px-4 py-1.5">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Spread</span>
                  <span className="font-mono text-xs font-bold text-primary">
                    {spread !== null ? `${spread.toLocaleString()} THB` : '—'}
                  </span>
                </div>

                {/* Bids (Buys) - Green */}
                <div className="flex-1 overflow-y-auto">
                  {bids.slice(0, 15).map((order) => (
                    <OrderBookRow
                      key={order.address}
                      price={order.price}
                      amount={order.amount}
                      type="buy"
                      maxAmount={maxBookAmount}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Middle: Chart & History (6 cols) */}
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-6">
          {/* Chart Card */}
          <Card className="flex flex-1 flex-col overflow-hidden border-border/60 bg-card/40 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-yellow-500" />
                <h3 className="text-sm font-bold">GRX/THB Price Action</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase text-muted-foreground">Last Price</p>
                  <p className="font-mono text-sm font-black leading-none text-yellow-600">
                    {lastPrice.toLocaleString()} <span className="text-[10px]">THB</span>
                  </p>
                </div>
                {priceChangePct !== null && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'gap-1 text-[9px]',
                      priceChangePct >= 0
                        ? 'border-green-200 bg-green-50 text-green-600'
                        : 'border-red-200 bg-red-50 text-red-600',
                    )}
                  >
                    {priceChangePct >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {priceChangePct >= 0 ? '+' : ''}
                    {priceChangePct.toFixed(2)}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative flex-1 bg-gradient-to-b from-primary/5 to-transparent p-0">
              {chartData.length === 0 ? (
                <EmptyState label="No price history on-chain yet" icon={TrendingUp} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 16, right: 16, bottom: 8, left: 8 }}>
                    <defs>
                      <linearGradient id="terminalPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      tickFormatter={(v: number) => v.toLocaleString()}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid #ffffff20',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString()} ${name === 'price' ? 'THB' : 'kWh'}`,
                        name === 'price' ? 'Price' : 'Volume',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#eab308"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#terminalPrice)"
                      animationDuration={500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Trade History */}
          <Card className="h-1/3 border-border/60 bg-card/40 backdrop-blur-md">
            <CardHeader className="border-b px-4 py-2">
              <CardTitle className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <History className="h-3 w-3" /> Recent Settlements
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-35px)] overflow-y-auto p-0">
              {trades.length === 0 ? (
                <EmptyState label="No settlements yet" />
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-muted/20 text-[9px] uppercase text-muted-foreground backdrop-blur-sm">
                    <tr>
                      <th className="px-4 py-1.5 font-bold">Time</th>
                      <th className="px-4 py-1.5 font-bold">Price</th>
                      <th className="px-4 py-1.5 text-right font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-[10px] font-mono">
                    {trades.slice(0, 20).map((trade) => (
                      <tr
                        key={trade.address}
                        className="border-b border-border/20 transition-colors hover:bg-muted/10"
                      >
                        <td className="px-4 py-1.5 text-muted-foreground">
                          {new Date(trade.time * 1000).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-1.5 font-bold text-yellow-600">
                          {trade.price.toLocaleString()} THB
                        </td>
                        <td className="px-4 py-1.5 text-right font-bold">
                          {trade.amount.toLocaleString()} kWh
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Order Entry (3 cols) */}
        <OrderEntry
          vwap={market?.vwap || 0}
          feeBps={market?.feeBps ?? 0}
          totalVolume={totalVolume}
          totalTrades={totalTrades}
          bestBid={bids[0]?.price ?? null}
          bestAsk={asks[0]?.price ?? null}
          spread={spread}
          activeOrders={market?.activeOrders ?? bids.length + asks.length}
        />
      </div>
    </div>
  );
}

function OrderEntry({
  vwap,
  feeBps,
  totalVolume,
  totalTrades,
  bestBid,
  bestAsk,
  spread,
  activeOrders,
}: {
  vwap: number;
  feeBps: number;
  totalVolume: number;
  totalTrades: number;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  activeOrders: number;
}) {
  return (
    <Card className="col-span-12 border-border/60 bg-card/40 backdrop-blur-md lg:col-span-3">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-xs font-bold uppercase tracking-widest">Market Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <MiniStat label="Total Volume" value={`${totalVolume.toLocaleString()} kWh`} />
          <MiniStat label="Total Trades" value={totalTrades.toLocaleString()} />
          <MiniStat label="Active Orders" value={activeOrders.toLocaleString()} />
          <MiniStat label="VWAP" value={vwap ? `${vwap.toLocaleString()} THB` : '—'} />
          <MiniStat label="Market Fee" value={`${(feeBps / 100).toFixed(2)} %`} />
          <MiniStat
            label="Best Bid"
            value={bestBid !== null ? `${bestBid.toLocaleString()} THB` : '—'}
            color="text-green-500"
          />
          <MiniStat
            label="Best Ask"
            value={bestAsk !== null ? `${bestAsk.toLocaleString()} THB` : '—'}
            color="text-red-500"
          />
          <MiniStat label="Spread" value={spread !== null ? `${spread.toLocaleString()} THB` : '—'} />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label, icon: Icon = Inbox }: { label: string; icon?: React.ElementType }) {
  return (
    <div className="flex h-full min-h-[120px] flex-1 flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
      <Icon className="h-6 w-6 opacity-40" />
      <p className="text-[11px] font-medium">{label}</p>
    </div>
  );
}

function OrderBookRow({
  price,
  amount,
  type,
  maxAmount,
}: {
  price: number;
  amount: number;
  type: 'buy' | 'sell';
  maxAmount: number;
}) {
  const width = Math.min((amount / maxAmount) * 100, 100);
  const isBuy = type === 'buy';

  return (
    <div className="group relative cursor-pointer hover:bg-muted/10">
      <div
        className={cn('absolute inset-y-0 right-0 opacity-10 transition-all', isBuy ? 'bg-green-500' : 'bg-red-500')}
        style={{ width: `${width}%` }}
      />
      <div className="relative z-10 grid grid-cols-3 px-4 py-1 font-mono text-[10px]">
        <span className={cn('font-bold', isBuy ? 'text-green-500' : 'text-red-500')}>
          {price.toLocaleString()}
        </span>
        <span className="text-right font-medium">{amount.toLocaleString()}</span>
        <span className="text-right text-muted-foreground">{(price * amount).toLocaleString()}</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn('font-mono text-[10px] font-bold', color)}>{value}</span>
    </div>
  );
}
