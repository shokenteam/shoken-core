import { CoreError, CoreErrorCode } from "../../errors";
import { assertPositive, isFiniteNumber } from "../../types";
import { assertLotSize, assertTickSize } from "../markets/math";
import type { Market } from "../markets";
import type { Order } from "./types";

export function validateOrder(order: Order, market: Market): void {
  if (!order.id) throw new CoreError(CoreErrorCode.INVALID_ORDER, "order.id is required");
  if (!order.marketId) throw new CoreError(CoreErrorCode.INVALID_ORDER, "order.marketId is required");
  if (order.marketId !== market.id) {
    throw new CoreError(CoreErrorCode.INVALID_ORDER, "order.marketId does not match market.id", {
      orderMarketId: order.marketId,
      marketId: market.id,
    });
  }

  if (!isFiniteNumber(order.quantity)) throw new CoreError(CoreErrorCode.INVALID_QUANTITY, "quantity must be a number");
  assertPositive("quantity", order.quantity);
  assertLotSize(market.lotSize, order.quantity);

  if (order.type === "LIMIT") {
    if (!isFiniteNumber(order.price)) throw new CoreError(CoreErrorCode.INVALID_PRICE, "LIMIT order requires price");
    assertPositive("price", order.price);
    assertTickSize(market.tickSize, order.price);
  }

  if (order.type === "MARKET" && order.price != null) {
    // allow but not recommended; depends on your design
    // treat as a soft rule? For now: ignore.
  }
}
