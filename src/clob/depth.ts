import type { Orderbook, OrderbookLevel, OrderbookSide } from "./types";

export function topN(book: Orderbook, side: OrderbookSide, n: number): OrderbookLevel[] {
  const arr = side === "bids" ? book.bids : book.asks;
  return arr.slice(0, Math.max(0, n));
}

export function totalDepthSize(levels: OrderbookLevel[]): number {
  return levels.reduce((acc, l) => acc + l.size, 0);
}
