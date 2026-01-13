import type { Price, Quantity } from "../types";

export type OrderbookSide = "bids" | "asks";

export interface OrderbookLevel {
  price: Price;
  size: Quantity; // aggregated size at this price level
}

export interface Orderbook {
  bids: OrderbookLevel[]; // sorted desc by price
  asks: OrderbookLevel[]; // sorted asc by price
  ts?: number;            // optional timestamp
}

export interface TopOfBook {
  bestBid?: OrderbookLevel;
  bestAsk?: OrderbookLevel;
  mid?: Price;
  spreadAbs?: Price;
  spreadPct?: number;
}
