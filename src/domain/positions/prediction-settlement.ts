import { CoreError, CoreErrorCode } from "../../errors";
import type { PredictionPosition } from "./types";

export type ResolvedOutcome = "YES" | "NO";

/**
 * Payout model (normalized):
 * - If position outcome matches resolution -> payout = shares * 1.0
 * - else payout = 0
 */
export function computePredictionPayout(pos: PredictionPosition, resolved: ResolvedOutcome): number {
  if (!pos) throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "Position is required");
  return pos.outcome === resolved ? pos.shares * 1.0 : 0;
}

/**
 * Profit (payout - cost basis).
 * Cost basis = shares * avgPrice
 */
export function computePredictionProfit(pos: PredictionPosition, resolved: ResolvedOutcome): number {
  const payout = computePredictionPayout(pos, resolved);
  const cost = pos.shares * pos.avgPrice;
  return payout - cost;
}
