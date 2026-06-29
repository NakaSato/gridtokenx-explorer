'use client';

import React, { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useCluster } from '@/app/(core)/providers/cluster';
import { PROGRAMS } from '../config';

// Trading account sizes (incl. 8-byte discriminator).
const MARKET_SIZE = 2760;
const ZONE_MARKET_SIZE = 576;

/**
 * Live header stat for the Trading page — real, read straight from the trading
 * program's global Market account (active_orders) plus the count of zone
 * markets. No mock. Shows "…" until first fetch, "RPC unreachable" on failure.
 */
export function TradingParticipantsStat() {
  const { url } = useCluster();
  const [label, setLabel] = useState<string>('…');

  useEffect(() => {
    let cancelled = false;
    const conn = new Connection(url, 'confirmed');
    const programId = new PublicKey(PROGRAMS.trading.id);

    const tick = async () => {
      try {
        const accounts = await conn.getProgramAccounts(programId);
        let activeOrders = 0;
        let zones = 0;
        for (const { account } of accounts) {
          const data = account.data;
          if (data.length === MARKET_SIZE) {
            activeOrders = data.subarray(8).readUInt32LE(64); // active_orders
          } else if (data.length === ZONE_MARKET_SIZE) {
            zones++;
          }
        }
        if (!cancelled) {
          setLabel(`${activeOrders.toLocaleString()} active orders · ${zones.toLocaleString()} zones`);
        }
      } catch {
        if (!cancelled) setLabel('RPC unreachable');
      }
    };

    tick();
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [url]);

  return <>{label}</>;
}
