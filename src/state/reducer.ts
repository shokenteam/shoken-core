import { CoreError, CoreErrorCode } from "../errors";
import type { EngineState } from "./state";
import type { DomainEvent } from "./events";
import { createOrderState, applyFill, cancelOrder } from "../domain/orders";
import { applyPredictionFill } from "../domain/positions/prediction";
import type { PredictionPosition, PerpPosition } from "../domain/positions";
import type { Quantity, Price } from "../types";

function getOrInitPerpPosition(state: EngineState, marketId: string): PerpPosition {
  return state.perps[marketId] ?? { marketId, size: 0, entryPrice: 0 };
}

function applyPerpFillSimple(pos: PerpPosition, fill: { price: Price; quantity: Quantity; side: "BUY" | "SELL" }): PerpPosition {
  // minimal accounting: signed size + avg entry update only when increasing same direction
  const signedQty = fill.side === "BUY" ? fill.quantity : -fill.quantity;
  const prevSize = pos.size;
  const nextSize = prevSize + signedQty;

  // opening from flat
  if (prevSize === 0) return { ...pos, size: nextSize, entryPrice: fill.price };

  // increasing in same direction
  const sameDir = Math.sign(prevSize) === Math.sign(nextSize) && Math.sign(signedQty) === Math.sign(prevSize);
  if (sameDir) {
    const prevAbs = Math.abs(prevSize);
    const addAbs = Math.abs(signedQty);
    const entryPrice = (pos.entryPrice * prevAbs + fill.price * addAbs) / (prevAbs + addAbs);
    return { ...pos, size: nextSize, entryPrice };
  }

  // reducing or flipping: keep entry unless flip
  const flips = Math.sign(prevSize) !== Math.sign(nextSize) && nextSize !== 0;
  if (flips) return { ...pos, size: nextSize, entryPrice: fill.price };
  return { ...pos, size: nextSize };
}

export function reduce(state: EngineState, event: DomainEvent): EngineState {
  switch (event.type) {
    case "ORDER_PLACED": {
      const os = createOrderState(event.order);
      return { ...state, orders: { ...state.orders, [event.order.id]: os } };
    }

    case "ORDER_CANCELED": {
      const os = state.orders[event.orderId];
      if (!os) return state; // idempotent
      const next = cancelOrder(os);
      return { ...state, orders: { ...state.orders, [event.orderId]: next } };
    }

    case "ORDER_FILLED": {
      const os = state.orders[event.orderId];
      if (!os) {
        // Fill arrived without tracked order (possible if you don't track all orders).
        // You can either create a shadow order state or ignore order tracking.
        // We'll track only positions here but throw for strictness.
        throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "Fill received for unknown orderId", { orderId: event.orderId });
      }

      const nextOrder = applyFill(os, {
        orderId: event.orderId,
        price: event.price,
        quantity: event.quantity,
        fee: event.fee,
        ts: event.ts,
      });

      // Apply fill to perp position (assume marketId is PERP when used here)
      const pos = getOrInitPerpPosition(state, event.marketId);
      const nextPos = applyPerpFillSimple(pos, { price: event.price, quantity: event.quantity, side: event.side });

      return {
        ...state,
        orders: { ...state.orders, [event.orderId]: nextOrder },
        perps: { ...state.perps, [event.marketId]: nextPos },
      };
    }

    case "MARK_PRICE_UPDATED": {
      const pos = state.perps[event.marketId];
      if (!pos) return state;
      return { ...state, perps: { ...state.perps, [event.marketId]: { ...pos, markPrice: event.markPrice } } };
    }

    case "PREDICTION_PRICE_UPDATED": {
      const pos = state.predictions[event.marketId];
      if (!pos) return state;
      if (pos.outcome !== event.outcome) return state; // keep separate positions for YES/NO
      const next: PredictionPosition = { ...pos, lastPrice: event.price };
      return { ...state, predictions: { ...state.predictions, [event.marketId]: next } };
    }

    default:
      return state;
  }
}
