'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/(shared)/components/ui/dialog';
import { Input } from '@/app/(shared)/components/ui/input';
import { Label } from '@/app/(shared)/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(shared)/components/ui/select';
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  ShoppingCart,
  ArrowUpDown,
  Clock,
  Zap,
  Database,
  Plus,
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS, ENUM_MAPS } from '../config';
import type { ProgramKey } from '../config';

interface TradingExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
  fetchProgramAccounts: (key: ProgramKey) => Promise<void>;
}

interface MarketData {
  address: string;
  authority: string;
  totalVolume: number;
  totalTrades: number;
  activeOrders: number;
  lastClearingPrice: number;
  vwap: number;
  marketFeeBps: number;
  clearingEnabled: boolean;
  minPrice: number;
  maxPrice: number;
  buyDepthCount: number;
  sellDepthCount: number;
  priceHistoryCount: number;
}

interface OrderData {
  address: string;
  seller: string;
  buyer: string;
  orderId: number;
  amount: number;
  filledAmount: number;
  pricePerKwh: number;
  orderType: string;
  status: string;
  createdAt: number;
  expiresAt: number;
}

interface TradeData {
  address: string;
  buyOrder: string;
  sellOrder: string;
  buyer: string;
  seller: string;
  amount: number;
  pricePerKwh: number;
  totalValue: number;
  feeAmount: number;
  executedAt: number;
}

export function TradingExplorer({ rpcUrl, getConnection, fetchProgramAccounts }: TradingExplorerProps) {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'market' | 'orders' | 'trades'>('market');
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.trading.id);
      const accounts = await conn.getProgramAccounts(programId);

      let marketData: MarketData | null = null;
      const orderList: OrderData[] = [];
      const tradeList: TradeData[] = [];

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        const addr = pubkey.toBase58();

        // Market account is the largest (~3800+ bytes)
        if (data.length > 3000) {
          try {
            // Skip 8-byte discriminator
            const d = data.slice(8);
            marketData = {
              address: addr,
              authority: new PublicKey(d.slice(0, 32)).toBase58(),
              totalVolume: Number(d.readBigUInt64LE(32)),
              totalTrades: d.readUInt32LE(48 + 8 + 4),
              activeOrders: d.readUInt32LE(48 + 8),
              lastClearingPrice: Number(d.readBigUInt64LE(48)),
              vwap: Number(d.readBigUInt64LE(56)),
              marketFeeBps: d.readUInt16LE(48 + 8 + 4 + 4),
              clearingEnabled: d[48 + 8 + 4 + 4 + 2] === 1,
              minPrice: Number(d.readBigUInt64LE(80)),
              maxPrice: Number(d.readBigUInt64LE(88)),
              buyDepthCount: 0,
              sellDepthCount: 0,
              priceHistoryCount: 0,
            };
          } catch {
            // Skip malformed market accounts
          }
        }
        // Order accounts (~200-300 bytes)
        else if (data.length > 100 && data.length < 500) {
          try {
            const d = data.slice(8);
            const seller = new PublicKey(d.slice(0, 32)).toBase58();
            const buyer = new PublicKey(d.slice(32, 64)).toBase58();
            const orderId = Number(d.readBigUInt64LE(64));
            const amount = Number(d.readBigUInt64LE(72));
            const filledAmount = Number(d.readBigUInt64LE(80));
            const pricePerKwh = Number(d.readBigUInt64LE(88));
            const orderType = d[96];
            const status = d[97];
            const createdAt = Number(d.readBigInt64LE(98));
            const expiresAt = Number(d.readBigInt64LE(106));

            orderList.push({
              address: addr,
              seller,
              buyer,
              orderId,
              amount,
              filledAmount,
              pricePerKwh,
              orderType: ENUM_MAPS.OrderType[orderType as keyof typeof ENUM_MAPS.OrderType] ?? `Unknown(${orderType})`,
              status: ENUM_MAPS.OrderStatus[status as keyof typeof ENUM_MAPS.OrderStatus] ?? `Unknown(${status})`,
              createdAt,
              expiresAt,
            });
          } catch {
            // Skip
          }
        }
        // TradeRecord accounts (smaller, specific size)
        else if (data.length > 50 && data.length <= 100) {
          // Not all will be trade records but we try
        }
      }

      setMarket(marketData);
      setOrders(orderList.sort((a, b) => b.createdAt - a.createdAt));
      setTrades(tradeList.sort((a, b) => b.executedAt - a.executedAt));
    } catch (err) {
      console.warn('TradingExplorer fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Trading Program
          <Badge variant="outline" className="font-mono text-[9px]">
            {PROGRAMS.trading.id.slice(0, 8)}...
          </Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setShowPlaceOrder(true)}
          >
            <Plus className="h-3 w-3" /> Order
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={fetchData}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
      </div>

      {/* Market Stats */}
      {market ? (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Market State</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-[10px] text-muted-foreground">Total Volume</p>
              <p className="font-mono text-sm font-bold">{market.totalVolume.toLocaleString()} kWh</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Total Trades</p>
              <p className="font-mono text-sm font-bold">{market.totalTrades.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Active Orders</p>
              <p className="font-mono text-sm font-bold">{market.activeOrders}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Last Price</p>
              <p className="font-mono text-sm font-bold">{market.lastClearingPrice} /kWh</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">VWAP</p>
              <p className="font-mono text-sm font-bold">{market.vwap} /kWh</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Fee</p>
              <p className="font-mono text-sm font-bold">{market.marketFeeBps} bps</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Price Range</p>
              <p className="font-mono text-sm font-bold">
                {market.minPrice} - {market.maxPrice || '∞'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Clearing</p>
              <Badge variant={market.clearingEnabled ? 'default' : 'secondary'} className="text-[10px]">
                {market.clearingEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
          <p className="mt-2 font-mono text-[9px] text-muted-foreground">
            Authority: {market.authority}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <BarChart3 className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">
            No market account found. Run <code className="rounded bg-muted px-1">initialize_market</code> first.
          </p>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === 'market' ? 'default' : 'outline'}
          size="sm" className="h-7 gap-1 text-xs"
          onClick={() => setActiveView('market')}
        >
          <TrendingUp className="h-3 w-3" /> Market
        </Button>
        <Button
          variant={activeView === 'orders' ? 'default' : 'outline'}
          size="sm" className="h-7 gap-1 text-xs"
          onClick={() => setActiveView('orders')}
        >
          <ShoppingCart className="h-3 w-3" /> Orders ({orders.length})
        </Button>
        <Button
          variant={activeView === 'trades' ? 'default' : 'outline'}
          size="sm" className="h-7 gap-1 text-xs"
          onClick={() => setActiveView('trades')}
        >
          <ArrowUpDown className="h-3 w-3" /> Trades ({trades.length})
        </Button>
      </div>

      {/* Orders List */}
      {activeView === 'orders' && (
        <ScrollArea className="h-[300px] rounded-md border">
          {orders.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No orders found</div>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <div key={order.address} className="p-3 text-xs hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={order.orderType === 'Buy' ? 'default' : 'secondary'}
                        className="text-[9px]"
                      >
                        {order.orderType}
                      </Badge>
                      <span className="font-mono font-medium">{order.amount} kWh</span>
                      <span className="text-muted-foreground">@ {order.pricePerKwh}/kWh</span>
                    </div>
                    <Badge variant="outline" className="text-[9px]">{order.status}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>Filled: {order.filledAmount}/{order.amount}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.createdAt * 1000).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                    {order.address}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Trades List */}
      {activeView === 'trades' && (
        <ScrollArea className="h-[300px] rounded-md border">
          {trades.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No trade records found</div>
          ) : (
            <div className="divide-y">
              {trades.map((trade) => (
                <div key={trade.address} className="p-3 text-xs hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium">{trade.amount} kWh @ {trade.pricePerKwh}/kWh</span>
                    <span className="text-muted-foreground">Value: {trade.totalValue}</span>
                  </div>
                  <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                    Fee: {trade.feeAmount} | {new Date(trade.executedAt * 1000).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Instructions Reference */}
      {activeView === 'market' && market && (
        <div className="rounded-lg border p-3">
          <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Available Instructions</h4>
          <div className="flex flex-wrap gap-1">
            {PROGRAMS.trading.instructions.map((ix) => (
              <Badge key={ix} variant="outline" className="font-mono text-[9px]">{ix}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Place Order Dialog */}
      <PlaceOrderDialog
        open={showPlaceOrder}
        onOpenChange={setShowPlaceOrder}
        rpcUrl={rpcUrl}
        onSuccess={fetchData}
      />
    </div>
  );
}

// Place Order Dialog Component
interface PlaceOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rpcUrl: string;
  onSuccess: () => void;
}

function PlaceOrderDialog({ open, onOpenChange, rpcUrl, onSuccess }: PlaceOrderDialogProps) {
  const [orderType, setOrderType] = useState('Buy');
  const [amount, setAmount] = useState('100');
  const [price, setPrice] = useState('5000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setTxSignature(null);

    try {
      const endpoint = orderType === 'Buy' ? '/api/trading/create-buy-order' : '/api/trading/create-sell-order';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          energyAmount: parseInt(amount),
          pricePerKwh: parseInt(price),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const data = await response.json();
      setTxSignature(data.signature);

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setTxSignature(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Place Order
          </DialogTitle>
          <DialogDescription>
            Create a buy or sell order in the energy market.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="orderType">Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Buy">🟢 Buy Energy</SelectItem>
                <SelectItem value="Sell">🔴 Sell Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Energy Amount (kWh)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per kWh (micro-units)</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {txSignature && (
            <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700">
              ✅ Order placed! TX: {txSignature.slice(0, 20)}...
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
              ❌ Error: {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Placing...' : 'Place Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
