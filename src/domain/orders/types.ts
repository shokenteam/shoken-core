import { OrderType, Side, TimeInForce } from "../../types";
import type { Price, Quantity } from "../../types";
import type { MarketId } from "../markets";

export type OrderId = string;

export interface Order {
  id: OrderId;
  marketId: MarketId;

  side: Side;
  type: OrderType;
  timeInForce: TimeInForce;

  // LIMIT requires price, MARKET can omit
  price?: Price;

  quantity: Quantity;

  // Optional flags
  postOnly?: boolean;
  reduceOnly?: boolean;

  createdAt: number; // ms timestamp
}

export enum OrderStatus {
  OPEN = "OPEN",
  PARTIALLY_FILLED = "PARTIALLY_FILLED",
  FILLED = "FILLED",
  CANCELED = "CANCELED",
}

export interface OrderState {
  order: Order;
  status: OrderStatus;
  filledQuantity: Quantity;
}
