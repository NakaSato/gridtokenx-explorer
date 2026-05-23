import { useState, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS, ENUM_MAPS } from '../config';
import { tradingApi, type SettlementStats } from '../services/trading-api';

export interface MarketData {
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

export interface OrderData {
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

export interface TradeData {
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

export function useTradingExplorerData(getConnection: () => Connection) {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [settlementStats, setSettlementStats] = useState<SettlementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        if (data.length > 2500) {
          try {
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
        } else if (data.length > 100 && data.length < 500) {
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
        } else if (data.length > 50 && data.length <= 100) {
          // Future trade records parsing
        }
      }

      setMarket(marketData);
      setOrders(orderList.sort((a, b) => b.createdAt - a.createdAt));
      setTrades(tradeList.sort((a, b) => b.executedAt - a.executedAt));

      try {
        const stats = await tradingApi.getSettlementStats();
        setSettlementStats(stats);
      } catch (err) {
        console.warn('Failed to fetch settlement stats:', err);
      }
    } catch (err) {
      console.warn('TradingExplorer fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  return {
    market,
    orders,
    trades,
    settlementStats,
    isLoading,
    fetchData,
  };
}
