import type { MarketId } from "../domain/markets";
import type { Price, Quantity } from "../types";
import type { Side, OrderType, TimeInForce } from "../types";

export type SpotOrderId = string;

export interface SpotOrder {
  id: SpotOrderId;
  marketId: MarketId;

  side: Side;              // BUY/SELL
  type: OrderType;         // LIMIT/MARKET
  timeInForce: TimeInForce;// GTC/IOC/FOK

  price?: Price;           // required for LIMIT
  quantity: Quantity;      // base qty

  createdAt: number;
}

export interface SpotFill {
  orderId: SpotOrderId;
  marketId: MarketId;

  price: Price;
  quantity: Quantity;

  // quote = price * quantity
  quote: number;

  fee?: number;
  ts: number;
}

export interface MatchResult {
  fills: SpotFill[];
  remainingQty: number;

  // updated book after consuming liquidity + potentially adding remaining limit order
  nextBook: import("../clob/types").Orderbook;
}
