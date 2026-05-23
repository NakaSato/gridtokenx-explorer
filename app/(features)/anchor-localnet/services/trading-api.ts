/**
 * Trading API Service
 * Handles communication with the GridTokenX API Gateway for P2P trading operations.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface P2PCostParams {
  buyerZoneId: number;
  sellerZoneId: number;
  energyAmount: number;
  agreedPrice: number;
}

export interface P2PCostResponse {
  total_cost: string;
  energy_cost: string;
  transmission_fee: string;
  platform_fee: string;
}

export interface SettlementStats {
  pending_count: number;
  processing_count: number;
  completed_count: number;
  failed_count: number;
  total_settled_value: number;
  recent_settlements: any[];
}

export interface MatchingStatus {
  is_active: boolean;
  last_run_at: string | null;
  pending_orders: number;
}

export const tradingApi = {
  /**
   * Calculate the estimated cost for a P2P trade
   */
  async calculateP2PCost(params: P2PCostParams): Promise<P2PCostResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/trading/p2p/calculate-cost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buyer_zone_id: params.buyerZoneId,
        seller_zone_id: params.sellerZoneId,
        energy_amount: params.energyAmount,
        agreed_price: params.agreedPrice,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to calculate P2P cost: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  },

  /**
   * Trigger the matching engine (Admin only)
   */
  async triggerMatchingEngine(authToken: string): Promise<{ success: boolean; message: string; matched_orders: number }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/match-orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to trigger matching engine: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get overall settlement statistics
   */
  async getSettlementStats(): Promise<SettlementStats> {
    const response = await fetch(`${API_BASE_URL}/api/v1/settlement-stats`);

    if (!response.ok) {
      throw new Error(`Failed to fetch settlement stats: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get matching engine status
   */
  async getMatchingStatus(): Promise<MatchingStatus> {
    const response = await fetch(`${API_BASE_URL}/api/v1/matching-status`);

    if (!response.ok) {
      throw new Error(`Failed to fetch matching status: ${response.statusText}`);
    }

    return response.json();
  }
};
