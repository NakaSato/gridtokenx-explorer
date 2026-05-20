'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/(shared)/components/ui/card';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Input } from '@/app/(shared)/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/(shared)/components/ui/tabs';
import { 
  Zap, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History,
  LayoutGrid,
  BarChart2,
  ListFilter
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import { cn } from '@/app/(shared)/utils/cn';

interface TradingTerminalProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

export function TradingTerminal({ rpcUrl, getConnection }: TradingTerminalProps) {
  const [market, setMarket] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTradingData = useCallback(async () => {
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.trading.id);
      const accounts = await conn.getProgramAccounts(programId);

      const orderList: any[] = [];
      const tradeList: any[] = [];
      let marketData: any = null;

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        const d = data.slice(8);

        if (data.length > 500) {
          marketData = {
            address: pubkey.toBase58(),
            totalVolume: Number(d.readBigUInt64LE(32)),
            lastPrice: Number(d.readBigUInt64LE(48)),
            totalTrades: d.readUInt32LE(68),
            priceHistory: Array.from({ length: 24 }).map((_, i) => {
               // Price history starts at offset 2160 in the raw data (after sharding metrics)
               const start = 2160 + (i * 24);
               if (start + 24 > d.length) return null;
               return {
                 price: Number(d.readBigUInt64LE(start)),
                 volume: Number(d.readBigUInt64LE(start + 8)),
                 time: Number(d.readBigInt64LE(start + 16))
               };
            }).filter(ph => ph && ph.time > 0)
          };
        } else if (data.length === 128) {
          orderList.push({
            address: pubkey.toBase58(),
            orderId: Number(d.readBigUInt64LE(64)),
            amount: Number(d.readBigUInt64LE(72)),
            filled: Number(d.readBigUInt64LE(80)),
            price: Number(d.readBigUInt64LE(88)),
            type: d[96] === 1 ? 'Buy' : 'Sell',
            status: d[97],
          });
        } else if (data.length === 184) {
           // TradeRecord
           tradeList.push({
             address: pubkey.toBase58(),
             amount: Number(d.readBigUInt64LE(128)),
             price: Number(d.readBigUInt64LE(136)),
             time: Number(d.readBigInt64LE(160)),
           });
        }
      }

      setMarket(marketData);
      setOrders(orderList);
      setTrades(tradeList.sort((a, b) => b.time - a.time));
    } catch (err) {
      console.error('TradingTerminal fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    fetchTradingData();
    const interval = setInterval(fetchTradingData, 3000);
    return () => clearInterval(interval);
  }, [fetchTradingData]);

  const bids = useMemo(() => orders.filter(o => o.type === 'Buy' && o.status <= 1).sort((a, b) => b.price - a.price), [orders]);
  const asks = useMemo(() => orders.filter(o => o.type === 'Sell' && o.status <= 1).sort((a, b) => a.price - b.price), [orders]);

  return (
    <div className="grid grid-cols-12 gap-4 h-[800px] bg-background/50 p-2">
      {/* Left: Order Book (3 cols) */}
      <Card className="col-span-12 lg:col-span-3 flex flex-col border-border/60 bg-card/40 backdrop-blur-md">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <ListFilter className="h-3.5 w-3.5 text-primary" /> Order Book
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-3 text-[10px] font-bold uppercase text-muted-foreground px-4 py-2 bg-muted/20 border-b">
            <span>Price</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Total</span>
          </div>
          
          {/* Asks (Sells) - Red */}
          <div className="flex-1 overflow-y-auto flex flex-col-reverse">
            {asks.slice(0, 15).reverse().map((order, i) => (
              <OrderBookRow key={i} price={order.price} amount={order.amount} type="sell" maxAmount={100} />
            ))}
          </div>

          {/* Spread */}
          <div className="bg-muted/30 px-4 py-1.5 border-y flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Spread</span>
            <span className="text-xs font-mono font-bold text-primary">
              {asks[0] && bids[0] ? (asks[0].price - bids[0].price) : '0'} THB
            </span>
          </div>

          {/* Bids (Buys) - Green */}
          <div className="flex-1 overflow-y-auto">
            {bids.slice(0, 15).map((order, i) => (
              <OrderBookRow key={i} price={order.price} amount={order.amount} type="buy" maxAmount={100} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Middle: Chart & History (6 cols) */}
      <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
        {/* Chart Card */}
        <Card className="flex-1 border-border/60 bg-card/40 backdrop-blur-md overflow-hidden flex flex-col">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-bold">GRX/THB Price Action</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Last Price</p>
                <p className="text-sm font-black text-yellow-600 font-mono leading-none">
                  {market?.lastPrice?.toLocaleString() ?? '0'} <span className="text-[10px]">THB</span>
                </p>
              </div>
              <Badge variant="outline" className="text-[9px] border-green-200 text-green-600 bg-green-50">+2.4%</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 relative bg-gradient-to-b from-primary/5 to-transparent">
             {/* Simple visual placeholder for chart since we don't have Recharts here */}
             <div className="absolute inset-0 flex items-end px-4 pb-8 gap-1">
                {[...Array(24)].map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  />
                ))}
             </div>
             <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-dashed border-border/40 w-full" />
                <div className="border-t border-dashed border-border/40 w-full" />
                <div className="border-t border-dashed border-border/40 w-full" />
                <div className="border-t border-dashed border-border/40 w-full" />
             </div>
          </CardContent>
        </Card>

        {/* Trade History */}
        <Card className="h-1/3 border-border/60 bg-card/40 backdrop-blur-md">
          <CardHeader className="py-2 px-4 border-b">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <History className="h-3 w-3" /> Recent Settlements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto h-[calc(100%-35px)]">
            <table className="w-full text-left">
              <thead className="bg-muted/20 text-[9px] uppercase text-muted-foreground sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-1.5 font-bold">Time</th>
                  <th className="px-4 py-1.5 font-bold">Price</th>
                  <th className="px-4 py-1.5 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-[10px] font-mono">
                {trades.slice(0, 20).map((trade, i) => (
                  <tr key={i} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-1.5 text-muted-foreground">{new Date(trade.time * 1000).toLocaleTimeString()}</td>
                    <td className="px-4 py-1.5 font-bold text-yellow-600">{trade.price} THB</td>
                    <td className="px-4 py-1.5 text-right font-bold">{trade.amount} kWh</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Right: Order Entry (3 cols) */}
      <Card className="col-span-12 lg:col-span-3 border-border/60 bg-card/40 backdrop-blur-md">
        <CardHeader className="py-3 px-4 border-b">
           <CardTitle className="text-xs font-bold uppercase tracking-widest">Execute Trade</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="buy" className="text-[10px] uppercase font-bold data-[state=active]:bg-green-500 data-[state=active]:text-white">Buy</TabsTrigger>
              <TabsTrigger value="sell" className="text-[10px] uppercase font-bold data-[state=active]:bg-red-500 data-[state=active]:text-white">Sell</TabsTrigger>
            </TabsList>
            
            <TabsContent value="buy" className="pt-4 space-y-4">
              <OrderInput label="Price (THB)" placeholder="0.00" />
              <OrderInput label="Amount (kWh)" placeholder="0" />
              <div className="pt-2">
                <div className="flex justify-between text-[10px] mb-1 font-bold uppercase text-muted-foreground">
                  <span>Estimated Total</span>
                  <span>0.00 THB</span>
                </div>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-10 shadow-lg shadow-green-500/20">
                  Submit Buy Order
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="sell" className="pt-4 space-y-4">
              <OrderInput label="Price (THB)" placeholder="0.00" />
              <OrderInput label="Amount (kWh)" placeholder="0" />
              <div className="pt-2">
                <div className="flex justify-between text-[10px] mb-1 font-bold uppercase text-muted-foreground">
                  <span>Estimated Revenue</span>
                  <span>0.00 THB</span>
                </div>
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-10 shadow-lg shadow-red-500/20">
                  Submit Sell Order
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-3 pt-4 border-t border-border/40">
            <h4 className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">Market Overview</h4>
            <MiniStat label="24h Volume" value={`${market?.totalVolume?.toLocaleString() ?? 0} kWh`} />
            <MiniStat label="Global Liquidity" value="High" color="text-green-500" />
            <MiniStat label="Active Shards" value="1/4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderBookRow({ price, amount, type, maxAmount }: any) {
  const width = Math.min((amount / maxAmount) * 100, 100);
  const isBuy = type === 'buy';

  return (
    <div className="relative group hover:bg-muted/10 cursor-pointer">
      <div 
        className={cn(
          "absolute inset-y-0 right-0 opacity-10 transition-all",
          isBuy ? "bg-green-500" : "bg-red-500"
        )} 
        style={{ width: `${width}%` }}
      />
      <div className="grid grid-cols-3 text-[10px] font-mono px-4 py-1 relative z-10">
        <span className={cn("font-bold", isBuy ? "text-green-500" : "text-red-500")}>
          {price.toLocaleString()}
        </span>
        <span className="text-right font-medium">{amount.toLocaleString()}</span>
        <span className="text-right text-muted-foreground">{(price * amount).toLocaleString()}</span>
      </div>
    </div>
  );
}

function OrderInput({ label, placeholder }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase text-muted-foreground">{label}</label>
      <Input 
        className="h-9 bg-background/50 border-border/60 text-sm font-mono focus-visible:ring-primary/20" 
        placeholder={placeholder} 
        type="number"
      />
    </div>
  );
}

function MiniStat({ label, value, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn("text-[10px] font-mono font-bold", color)}>{value}</span>
    </div>
  );
}
