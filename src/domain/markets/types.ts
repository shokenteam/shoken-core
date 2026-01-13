import { MarketStatus, MarketType } from "../../types";

export type MarketId = string;

export interface Market {
  id: MarketId;
  type: MarketType;
  status: MarketStatus;

  baseAsset: string;  // e.g. SOL, BTC, YES
  quoteAsset: string; // e.g. USDC

  // For order validation / normalization
  tickSize: number; // minimum price increment
  lotSize: number;  // minimum quantity increment

  // Optional metadata
  venue?: string;   // e.g. Drift, Polymarket, InternalCLOB
  symbol?: string;  // e.g. SOL-PERP
}
