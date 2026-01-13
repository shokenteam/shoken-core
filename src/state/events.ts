import type { MarketId } from "../domain/markets";
import type { Order } from "../domain/orders";
import type { Price, Quantity } from "../types";

export type DomainEvent =
  | { type: "ORDER_PLACED"; order: Order }
  | { type: "ORDER_CANCELED"; orderId: string }
  | { type: "ORDER_FILLED"; orderId: string; marketId: MarketId; price: Price; quantity: Quantity; side: "BUY" | "SELL"; fee?: number; ts: number }
  | { type: "MARK_PRICE_UPDATED"; marketId: MarketId; markPrice: Price; ts: number }
  | { type: "PREDICTION_PRICE_UPDATED"; marketId: MarketId; outcome: "YES" | "NO"; price: Price; ts: number };
