import { useState, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import {
  decodeMarket,
  decodeOrder,
  decodeTradeRecord,
  decodeZoneMarket,
  MARKET_ACCOUNT_SIZE,
  ORDER_ACCOUNT_SIZE,
  TRADE_RECORD_ACCOUNT_SIZE,
  ZONE_MARKET_ACCOUNT_SIZE,
  type ZoneMarketData,
} from '../lib/trading-decoders';
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
  const [zoneMarkets, setZoneMarkets] = useState<ZoneMarketData[]>([]);
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
      const zoneList: ZoneMarketData[] = [];

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        const addr = pubkey.toBase58();

        try {
          if (data.length === MARKET_ACCOUNT_SIZE) {
            marketData = decodeMarket(data, addr);
          } else if (data.length === ORDER_ACCOUNT_SIZE) {
            orderList.push(decodeOrder(data, addr));
          } else if (data.length === TRADE_RECORD_ACCOUNT_SIZE) {
            tradeList.push(decodeTradeRecord(data, addr));
          } else if (data.length === ZONE_MARKET_ACCOUNT_SIZE) {
            zoneList.push(decodeZoneMarket(data, addr));
          }
        } catch {
          // Skip malformed accounts
        }
      }

      setMarket(marketData);
      setOrders(orderList.sort((a, b) => b.createdAt - a.createdAt));
      setTrades(tradeList.sort((a, b) => b.executedAt - a.executedAt));
      setZoneMarkets(zoneList.sort((a, b) => a.zoneId - b.zoneId));

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
    zoneMarkets,
    settlementStats,
    isLoading,
    fetchData,
  };
}
