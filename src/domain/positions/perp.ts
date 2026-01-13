import type { PerpPosition } from "./types";
import type { Quantity, Price } from "../../types";
import { CoreError, CoreErrorCode } from "../../errors";

export interface PerpFill {
  price: Price;
  quantity: Quantity; // positive quantity of base/contract
  side: "BUY" | "SELL";
}

/**
 * Update perp position using weighted average entry accounting.
 * - BUY increases long / reduces short
 * - SELL increases short / reduces long
 */
export function applyPerpFill(pos: PerpPosition | undefined, fill: PerpFill): PerpPosition {
  const signedQty = fill.side === "BUY" ? fill.quantity : -fill.quantity;

  if (!pos) {
    return { marketId: "UNKNOWN", size: signedQty, entryPrice: fill.price };
  }

  if (pos.marketId === "UNKNOWN") {
    throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "Position marketId must be set by caller");
  }

  const newSize = pos.size + signedQty;

  // If position flips direction, set entry to fill price for simplicity.
  // You can implement more precise realized PnL tracking elsewhere.
  if (pos.size === 0) {
    return { ...pos, size: newSize, entryPrice: fill.price };
  }

  // Same direction: update weighted average entry
  const sameDirection = Math.sign(pos.size) === Math.sign(newSize) && Math.sign(newSize) !== 0;
  if (sameDirection && Math.sign(signedQty) === Math.sign(pos.size)) {
    const prevAbs = Math.abs(pos.size);
    const addAbs = Math.abs(signedQty);
    const entryPrice = (pos.entryPrice * prevAbs + fill.price * addAbs) / (prevAbs + addAbs);
    return { ...pos, size: newSize, entryPrice };
  }

  // Reducing position or flipping:
  // Keep entryPrice if reducing but not flipping; if flips, reset entryPrice.
  const flips = Math.sign(pos.size) !== Math.sign(newSize) && Math.sign(newSize) !== 0;
  if (flips) return { ...pos, size: newSize, entryPrice: fill.price };
  if (newSize === 0) return { ...pos, size: 0 }; // flat, keep entryPrice for history if desired
  return { ...pos, size: newSize };
}
