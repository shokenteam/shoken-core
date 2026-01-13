import { CoreError, CoreErrorCode } from "../../errors";
import type { Price, Quantity } from "../../types";
import type { PerpPosition } from "./types";

export interface PerpFill {
  price: Price;
  quantity: Quantity;           // positive
  side: "BUY" | "SELL";         // BUY increases long / reduces short
  fee?: number;                 // quote fee
}

function signQty(fill: PerpFill): number {
  return fill.side === "BUY" ? fill.quantity : -fill.quantity;
}

/**
 * Apply a fill to a perp position using:
 * - signed size accounting
 * - realized PnL when reducing/closing exposure
 * - avg entry update when increasing same-direction exposure
 *
 * This is deterministic and venue-agnostic.
 */
export function applyPerpFill(pos: PerpPosition, fill: PerpFill): PerpPosition {
  if (!(fill.quantity > 0)) {
    throw new CoreError(CoreErrorCode.INVALID_QUANTITY, "fill.quantity must be > 0", { quantity: fill.quantity });
  }
  if (!(fill.price > 0)) {
    throw new CoreError(CoreErrorCode.INVALID_PRICE, "fill.price must be > 0", { price: fill.price });
  }

  const dq = signQty(fill);
  const prevSize = pos.size;
  const nextSize = prevSize + dq;

  let realizedDelta = 0;
  let nextAvgEntry = pos.avgEntry;

  // If opening from flat
  if (prevSize === 0) {
    nextAvgEntry = fill.price;
  } else {
    const prevSign = Math.sign(prevSize);
    const fillSign = Math.sign(dq);

    // Increasing exposure in same direction -> update avg entry
    if (prevSign === fillSign) {
      const prevAbs = Math.abs(prevSize);
      const addAbs = Math.abs(dq);
      nextAvgEntry = (pos.avgEntry * prevAbs + fill.price * addAbs) / (prevAbs + addAbs);
    } else {
      // Reducing exposure (or flipping). Realized PnL comes from closed quantity.
      const closedAbs = Math.min(Math.abs(prevSize), Math.abs(dq));

      // Long closed by SELL: (exit - entry) * qty
      // Short closed by BUY: (entry - exit) * qty
      if (prevSize > 0) {
        // closing long with SELL
        realizedDelta = (fill.price - pos.avgEntry) * closedAbs;
      } else {
        // closing short with BUY
        realizedDelta = (pos.avgEntry - fill.price) * closedAbs;
      }

      // If flip occurs, new avg entry becomes fill price for the remaining exposure
      const flips = Math.sign(nextSize) !== 0 && Math.sign(nextSize) !== prevSign;
      if (flips) nextAvgEntry = fill.price;

      // If fully closed to flat, avgEntry can remain (history) or set to 0; keep it.
    }
  }

  return {
    ...pos,
    size: nextSize,
    avgEntry: nextAvgEntry,
    realizedPnl: pos.realizedPnl + realizedDelta,
    feesPaid: pos.feesPaid + (fill.fee ?? 0),
  };
}

export function computeUnrealizedPnl(pos: PerpPosition, mark?: Price): number {
  const mp = mark ?? pos.markPrice;
  if (mp == null || pos.size === 0) return 0;
  // long: (mark - entry)*size, short: size is negative so formula still works
  return (mp - pos.avgEntry) * pos.size;
}
