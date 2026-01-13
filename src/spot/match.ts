import { CoreError, CoreErrorCode } from "../errors";
import type { Orderbook, OrderbookLevel } from "../clob/types";
import { normalizeOrderbook } from "../clob/normalize";
import type { SpotOrder, SpotFill, MatchResult } from "./types";
import { OrderType, Side, TimeInForce } from "../types";

function cloneLevels(levels: OrderbookLevel[]): OrderbookLevel[] {
  return levels.map((l) => ({ price: l.price, size: l.size }));
}

function consume(
  levels: OrderbookLevel[],
  wantQty: number
): { fills: { price: number; qty: number }[]; remaining: number; nextLevels: OrderbookLevel[] } {
  let remaining = wantQty;
  const fills: { price: number; qty: number }[] = [];

  const next = cloneLevels(levels);

  for (let i = 0; i < next.length && remaining > 0; i++) {
    const lvl = next[i];
    if (lvl.size <= 0) continue;

    const take = Math.min(remaining, lvl.size);
    if (take <= 0) continue;

    fills.push({ price: lvl.price, qty: take });
    lvl.size -= take;
    remaining -= take;
  }

  // remove empty levels
  const compact = next.filter((l) => l.size > 1e-12);
  return { fills, remaining, nextLevels: compact };
}

function canCrossLimit(order: SpotOrder, book: Orderbook): boolean {
  const bestBid = book.bids[0]?.price;
  const bestAsk = book.asks[0]?.price;

  if (order.side === Side.BUY) {
    // buy limit crosses if price >= best ask
    return bestAsk != null && order.price != null && order.price >= bestAsk;
  } else {
    // sell limit crosses if price <= best bid
    return bestBid != null && order.price != null && order.price <= bestBid;
  }
}

function enforceFOK(filled: number, requested: number) {
  if (filled + 1e-10 < requested) {
    throw new CoreError(CoreErrorCode.INSUFFICIENT_LIQUIDITY, "FOK could not be fully filled", {
      filled,
      requested,
    });
  }
}

export function matchSpotOrderAgainstBook(input: {
  order: SpotOrder;
  book: Orderbook;
  ts: number;
  feeBps?: number; // optional fee model, e.g. 10 = 0.10%
}): MatchResult {
  const { order, ts } = input;
  const feeBps = input.feeBps ?? 0;

  if (!(order.quantity > 0)) {
    throw new CoreError(CoreErrorCode.INVALID_QUANTITY, "order.quantity must be > 0", { quantity: order.quantity });
  }

  // Ensure normalized book (sorted, merged)
  const book = normalizeOrderbook({ bids: input.book.bids as any, asks: input.book.asks as any, ts: input.book.ts });

  const isMarket = order.type === OrderType.MARKET;
  const isLimit = order.type === OrderType.LIMIT;

  if (isLimit && !(order.price != null && order.price > 0)) {
    throw new CoreError(CoreErrorCode.INVALID_PRICE, "LIMIT order requires price > 0", { price: order.price });
  }

  // For LIMIT orders that don't cross, no fill; potentially add to book if GTC.
  if (isLimit && !canCrossLimit(order, book)) {
    if (order.timeInForce === TimeInForce.IOC || order.timeInForce === TimeInForce.FOK) {
      // IOC/FOK that doesn't cross => 0 fill, no rest posted
      if (order.timeInForce === TimeInForce.FOK) enforceFOK(0, order.quantity);
      return { fills: [], remainingQty: order.quantity, nextBook: book };
    }

    // GTC: post it to book
    const nextBook: Orderbook =
      order.side === Side.BUY
        ? { ...book, bids: insertLevel(book.bids, { price: order.price!, size: order.quantity }, "bids") }
        : { ...book, asks: insertLevel(book.asks, { price: order.price!, size: order.quantity }, "asks") };

    return { fills: [], remainingQty: 0, nextBook };
  }

  // Otherwise: consume liquidity up to limit price (if LIMIT), or fully (if MARKET)
  const consumeSide = order.side === Side.BUY ? "asks" : "bids";
  const levels = consumeSide === "asks" ? book.asks : book.bids;

  // filter levels by limit price if LIMIT
  const tradableLevels =
    isMarket
      ? levels
      : consumeSide === "asks"
        ? levels.filter((l) => l.price <= (order.price as number))
        : levels.filter((l) => l.price >= (order.price as number));

  const { fills: rawFills, remaining, nextLevels } = consume(tradableLevels, order.quantity);
  const filledQty = order.quantity - remaining;

  if (order.timeInForce === TimeInForce.FOK) enforceFOK(filledQty, order.quantity);

  const spotFills: SpotFill[] = rawFills.map((f) => {
    const quote = f.price * f.qty;
    const fee = feeBps > 0 ? (quote * feeBps) / 10_000 : 0;
    return {
      orderId: order.id,
      marketId: order.marketId,
      price: f.price,
      quantity: f.qty,
      quote,
      fee,
      ts,
    };
  });

  // Construct next book:
  // - Replace only the consumed side levels with updated compact levels
  // - Keep untouched side as-is
  let nextBook: Orderbook;
  if (consumeSide === "asks") {
    // rebuild asks: apply nextLevels into full asks by removing consumed subset and merging
    nextBook = { ...book, asks: mergeAfterConsume(book.asks, tradableLevels, nextLevels) };
  } else {
    nextBook = { ...book, bids: mergeAfterConsume(book.bids, tradableLevels, nextLevels) };
  }

  // If LIMIT + remaining qty and GTC => post remainder at limit price
  if (isLimit && remaining > 1e-12 && order.timeInForce === TimeInForce.GTC) {
    if (order.side === Side.BUY) {
      nextBook = { ...nextBook, bids: insertLevel(nextBook.bids, { price: order.price!, size: remaining }, "bids") };
    } else {
      nextBook = { ...nextBook, asks: insertLevel(nextBook.asks, { price: order.price!, size: remaining }, "asks") };
    }
    return { fills: spotFills, remainingQty: 0, nextBook };
  }

  return { fills: spotFills, remainingQty: remaining, nextBook };
}

/**
 * Insert/merge a level into a sorted side.
 */
function insertLevel(side: OrderbookLevel[], level: OrderbookLevel, which: "bids" | "asks"): OrderbookLevel[] {
  const out = cloneLevels(side);

  // merge if same price exists
  const idx = out.findIndex((l) => Math.abs(l.price - level.price) < 1e-12);
  if (idx >= 0) {
    out[idx].size += level.size;
  } else {
    out.push({ ...level });
  }

  // sort
  out.sort((a, b) => (which === "bids" ? b.price - a.price : a.price - b.price));
  return out;
}

/**
 * Replace consumed subset with nextLevels while keeping other levels intact.
 * For aggregated-level books, simplest is to:
 * - remove all tradableLevels prices from original
 * - add nextLevels back
 * - sort
 */
function mergeAfterConsume(
  original: OrderbookLevel[],
  consumedSubset: OrderbookLevel[],
  nextSubset: OrderbookLevel[]
): OrderbookLevel[] {
  const consumedPrices = new Set(consumedSubset.map((l) => l.price));
  const kept = original.filter((l) => !consumedPrices.has(l.price));
  const merged = [...kept, ...nextSubset].filter((l) => l.size > 1e-12);

  // sort direction depends on whether this is bids or asks; infer from ordering:
  // if best price is highest => bids
  const isBids = merged.length >= 2 ? merged[0].price >= merged[1].price : false;
  merged.sort((a, b) => (isBids ? b.price - a.price : a.price - b.price));

  return merged;
}
