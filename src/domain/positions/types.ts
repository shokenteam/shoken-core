import type { MarketId } from "../markets";
import type { Price, Quantity } from "../../types";

export type PositionId = string;

export interface PerpPosition {
  marketId: MarketId;
  size: Quantity;       // positive = long, negative = short
  entryPrice: Price;    // average entry
  markPrice?: Price;    // latest mark
}

export interface PredictionPosition {
  marketId: MarketId;
  outcome: "YES" | "NO";
  shares: Quantity;
  avgPrice: Price;      // normalized 0..1
  lastPrice?: Price;    // normalized 0..1
}

export type Position = PerpPosition | PredictionPosition;
