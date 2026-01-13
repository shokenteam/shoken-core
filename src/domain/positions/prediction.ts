import type { PredictionPosition } from "./types";
import type { Price, Quantity } from "../../types";
import { CoreError, CoreErrorCode } from "../../errors";

export interface PredictionFill {
  outcome: "YES" | "NO";
  price: Price;      // normalized 0..1
  shares: Quantity;  // positive
}

export function assertProbabilityPrice(p: number): void {
  if (!(p >= 0 && p <= 1)) {
    throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "Prediction price must be in [0,1]", { price: p });
  }
}

export function applyPredictionFill(
  pos: PredictionPosition | undefined,
  marketId: string,
  fill: PredictionFill
): PredictionPosition {
  assertProbabilityPrice(fill.price);
  if (fill.shares <= 0) throw new CoreError(CoreErrorCode.INVALID_QUANTITY, "shares must be > 0");

  if (!pos) {
    return { marketId, outcome: fill.outcome, shares: fill.shares, avgPrice: fill.price };
  }

  if (pos.marketId !== marketId) {
    throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "marketId mismatch", { posMarketId: pos.marketId, marketId });
  }
  if (pos.outcome !== fill.outcome) {
    // You can model YES and NO as separate positions per market; simplest: enforce one outcome per position.
    throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "Cannot mix YES/NO in a single position");
  }

  const prev = pos.shares;
  const next = prev + fill.shares;
  const avgPrice = (pos.avgPrice * prev + fill.price * fill.shares) / next;

  return { ...pos, shares: next, avgPrice, lastPrice: fill.price };
}

export function positionValue(pos: PredictionPosition, lastPrice: number): number {
  assertProbabilityPrice(lastPrice);
  return pos.shares * lastPrice;
}

export function resolvedPayout(pos: PredictionPosition, resolvedOutcome: "YES" | "NO"): number {
  return pos.outcome === resolvedOutcome ? pos.shares * 1.0 : 0.0;
}
