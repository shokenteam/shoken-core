import { CoreError, CoreErrorCode } from "../../errors";
import type { Quantity } from "../../types";
import { assertPositive } from "../../types";
import type { Order, OrderState } from "./types";
import { OrderStatus } from "./types";

export interface Fill {
  orderId: string;
  price: number;
  quantity: Quantity;
  fee?: number;
  ts: number;
}

export function createOrderState(order: Order): OrderState {
  return { order, status: OrderStatus.OPEN, filledQuantity: 0 };
}

export function applyFill(state: OrderState, fill: Fill): OrderState {
  if (fill.orderId !== state.order.id) {
    throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "fill.orderId does not match order.id", {
      fillOrderId: fill.orderId,
      orderId: state.order.id,
    });
  }

  assertPositive("fill.quantity", fill.quantity);

  const remaining = state.order.quantity - state.filledQuantity;
  if (fill.quantity - remaining > 1e-10) {
    throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "fill.quantity exceeds remaining order quantity", {
      remaining,
      fillQty: fill.quantity,
    });
  }

  const filledQuantity = state.filledQuantity + fill.quantity;

  const status =
    Math.abs(filledQuantity - state.order.quantity) < 1e-10
      ? OrderStatus.FILLED
      : OrderStatus.PARTIALLY_FILLED;

  return { ...state, filledQuantity, status };
}

export function cancelOrder(state: OrderState): OrderState {
  if (state.status === OrderStatus.FILLED) {
    throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "Cannot cancel a filled order");
  }
  return { ...state, status: OrderStatus.CANCELED };
}
