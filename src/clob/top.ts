import type { Orderbook, TopOfBook } from "./types";

export function getTopOfBook(book: Orderbook): TopOfBook {
  const bestBid = book.bids[0];
  const bestAsk = book.asks[0];

  if (!bestBid || !bestAsk) {
    return { bestBid, bestAsk };
  }

  const mid = (bestBid.price + bestAsk.price) / 2;
  const spreadAbs = bestAsk.price - bestBid.price;
  const spreadPct = mid > 0 ? spreadAbs / mid : undefined;

  return { bestBid, bestAsk, mid, spreadAbs, spreadPct };
}
