import type { MarketId } from "../markets";
import type { PredictionPosition, PerpPosition } from "../positions";

export interface Balances {
  // quote balance only for now; extend later (multi-asset)
  USDC: number;
}

export interface PortfolioState {
  walletAddress: string;

  balances: Balances;

  perps: Record<MarketId, PerpPosition>;
  predictions: Record<MarketId, PredictionPosition>;

  // optional: open orders tracked by id
  openOrders?: Record<string, unknown>;
}

export interface PortfolioSummary {
  equityUSDC: number;
  availableUSDC: number;

  unrealizedPnlUSDC: number;
  exposureUSDC: number;

  perpCount: number;
  predictionCount: number;
}
