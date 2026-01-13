import { CoreError, CoreErrorCode } from "../errors";
import type { Orderbook, OrderbookSide } from "./types";

export interface VwapResult {
  filledSize: number;
  avgPrice?: number;
  cost?: number;       // quote spent/received
  remainingSize: number;
}

export function estimateVwapForSize(book: Orderbook, side: OrderbookSide, targetSize: number): VwapResult {
  if (!(targetSize > 0)) {
    throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "targetSize must be > 0", { targetSize });
  }

  // If you BUY, you consume asks. If you SELL, you consume bids.
  const levels = side === "bids" ? book.bids : book.asks;

  let remaining = targetSize;
  let filled = 0;
  let cost = 0;

  for (const lvl of levels) {
    if (remaining <= 0) break;

    const take = Math.min(remaining, lvl.size);
    filled += take;
    cost += take * lvl.price;
    remaining -= take;
  }

  const avgPrice = filled > 0 ? cost / filled : undefined;
  return { filledSize: filled, avgPrice, cost, remainingSize: remaining };
}
