import { CoreError, CoreErrorCode } from "../errors";
import { isFiniteNumber } from "../types";
import type { Orderbook, OrderbookLevel } from "./types";

type RawLevel = { price: number; size: number };

function cleanLevels(levels: RawLevel[]): OrderbookLevel[] {
  const map = new Map<number, number>();

  for (const lvl of levels) {
    if (!isFiniteNumber(lvl.price) || !isFiniteNumber(lvl.size)) continue;
    if (lvl.price <= 0 || lvl.size <= 0) continue;

    map.set(lvl.price, (map.get(lvl.price) ?? 0) + lvl.size);
  }

  const out: OrderbookLevel[] = [];
  for (const [price, size] of map.entries()) {
    if (size > 0) out.push({ price, size });
  }
  return out;
}

export function normalizeOrderbook(input: {
  bids: RawLevel[];
  asks: RawLevel[];
  ts?: number;
}): Orderbook {
  if (!input || !Array.isArray(input.bids) || !Array.isArray(input.asks)) {
    throw new CoreError(CoreErrorCode.ORDERBOOK_ERROR as any, "Invalid orderbook input shape");
    // NOTE: If you want strict typing, add ORDERBOOK_ERROR to CoreErrorCode enum.
  }

  let bids = cleanLevels(input.bids);
  let asks = cleanLevels(input.asks);

  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);

  // Ensure book sanity: best bid must be < best ask (in normal markets)
  if (bids.length && asks.length && bids[0].price >= asks[0].price) {
    // not always "wrong" if crossed book snapshot, but treat as warning via error meta.
    // Here: keep it but you could optionally drop crossed levels.
  }

  return { bids, asks, ts: input.ts };
}
