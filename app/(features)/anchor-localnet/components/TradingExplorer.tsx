'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import { 
  RefreshCw, 
  Plus, 
  Zap,
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import type { ProgramKey } from '../config';
import { toast } from 'sonner';
import { cn } from '@/app/(shared)/utils/cn';
import { Card } from '@/app/(shared)/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/(shared)/components/ui/tabs';

// Refactored Sub-components
import { InstructionReference } from './shared-explorer/InstructionReference';
import { MarketStatsCard } from './trading/MarketStatsCard';
import { OrdersTable } from './trading/OrdersTable';
import { TradesTable } from './trading/TradesTable';
import { PlaceOrderDialog } from './trading/PlaceOrderDialog';

interface TradingExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
  fetchProgramAccounts?: (key: ProgramKey) => Promise<void>;
}

interface MarketData {
  address: string;
  authority: string;
  totalVolume: number;
  totalTrades: number;
  lastPrice: number;
  clearingEnabled: boolean;
  minPrice: number;
}

interface OrderData {
  address: string;
  orderId: number;
  owner: string;
  orderType: string;
  energyAmount: number;
  energyFilled: number;
  pricePerKwh: number;
  status: string;
  createdAt: number;
}

interface TradeData {
  address: string;
  buyOrder: string;
  sellOrder: string;
  energyAmount: number;
  pricePerKwh: number;
  executedAt: number;
}

export function TradingExplorer({ rpcUrl, getConnection }: TradingExplorerProps) {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'market' | 'history'>('market');
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.trading.id);
      const accounts = await conn.getProgramAccounts(programId);

      const orderList: OrderData[] = [];
      const tradeList: TradeData[] = [];
      let marketData: MarketData | null = null;

      for (const { pubkey, account } of accounts) {
        const data = account.data;

        // MarketRecord (zero_copy)
        if (data.length > 500) {
          try {
            const d = data.slice(8);
            marketData = {
              address: pubkey.toBase58(),
              authority: new PublicKey(d.slice(0, 32)).toBase58(),
              totalVolume: Number(d.readBigUInt64LE(32)),
              totalTrades: d.readUInt32LE(68),
              lastPrice: Number(d.readBigUInt64LE(48)),
              clearingEnabled: d[75] === 1,
              minPrice: Number(d.readBigUInt64LE(88)),
            };
          } catch (err) {
            console.error('Error parsing market record:', err);
          }
        } 
        // OrderRecord (fixed size 128)
        else if (data.length === 128) {
          try {
            const d = data.slice(8);
            // Struct: seller (32), buyer (32), order_id (8), amount (8), filled (8), price (8), type (1), status (1)
            const seller = new PublicKey(d.slice(0, 32)).toBase58();
            const buyer = new PublicKey(d.slice(32, 64)).toBase58();
            const orderId = Number(d.readBigUInt64LE(64));
            const energyAmount = Number(d.readBigUInt64LE(72));
            const energyFilled = Number(d.readBigUInt64LE(80));
            const pricePerKwh = Number(d.readBigUInt64LE(88));
            const orderTypeNum = d[96];
            const statusNum = d[97];
            const createdAt = Number(d.readBigInt64LE(104));

            // Status Map: 0=Active, 1=PartiallyFilled, 2=Completed, 3=Cancelled, 4=Expired
            const statusLabels = ['Open', 'Partial', 'Completed', 'Cancelled', 'Expired'];
            const owner = orderTypeNum === 1 ? buyer : seller; // 0=Sell, 1=Buy in some contexts, but let's check ENUM_MAPS

            orderList.push({
              address: pubkey.toBase58(),
              owner,
              orderId,
              energyAmount,
              energyFilled,
              pricePerKwh,
              orderType: orderTypeNum === 1 ? 'Buy' : 'Sell',
              status: statusLabels[statusNum] || 'Unknown',
              createdAt,
            });
          } catch (err) {
            console.error('Error parsing order record:', err);
          }
        }
        // TradeRecord (size 184)
        else if (data.length === 184) {
          try {
            const d = data.slice(8);
            // Struct: sell_order (32), buy_order (32), seller (32), buyer (32), amount (8), price (8), total (8), fee (8), executed (8)
            const buyOrder = new PublicKey(d.slice(32, 64)).toBase58();
            const sellOrder = new PublicKey(d.slice(0, 32)).toBase58();
            const energyAmount = Number(d.readBigUInt64LE(128));
            const pricePerKwh = Number(d.readBigUInt64LE(136));
            const executedAt = Number(d.readBigInt64LE(160));

            tradeList.push({
              address: pubkey.toBase58(),
              buyOrder,
              sellOrder,
              energyAmount,
              pricePerKwh,
              executedAt,
            });
          } catch (err) {
            console.error('Error parsing trade record:', err);
          }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/30">
            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-none">Trading Program</h3>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {PROGRAMS.trading.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setShowPlaceOrder(true)}
          >
            <Plus className="h-3.5 w-3.5" /> New Order
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchData}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Market Stats Card */}
      {market && <MarketStatsCard market={market} />}

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-[400px] grid-cols-2 h-9">
            <TabsTrigger value="market" className="text-xs">Order Book</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Execution History</TabsTrigger>
          </TabsList>
          
          <Badge variant="outline" className="h-6 font-mono text-[10px]">
            {activeView === 'market' ? `${orders.length} Active Orders` : `${trades.length} Total Trades`}
          </Badge>
        </div>

        <TabsContent value="market" className="mt-0 space-y-4">
          <Card className="overflow-hidden border-border/60">
            <OrdersTable orders={orders} />
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0 space-y-4">
          <Card className="overflow-hidden border-border/60">
            <TradesTable trades={trades} />
          </Card>
        </TabsContent>
      </Tabs>

      <InstructionReference title="Trading Instruction Set" instructions={PROGRAMS.trading.instructions} />

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
