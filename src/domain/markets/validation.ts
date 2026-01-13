import { CoreError, CoreErrorCode } from "../../errors";
import { isFiniteNumber } from "../../types";
import { Market } from "./types";

export function validateMarket(m: Market): void {
  if (!m.id) throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "market.id is required");
  if (!m.baseAsset) throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "market.baseAsset is required");
  if (!m.quoteAsset) throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "market.quoteAsset is required");

  if (!isFiniteNumber(m.tickSize) || m.tickSize <= 0) {
    throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "market.tickSize must be > 0", { tickSize: m.tickSize });
  }
  if (!isFiniteNumber(m.lotSize) || m.lotSize <= 0) {
    throw new CoreError(CoreErrorCode.VALIDATION_ERROR, "market.lotSize must be > 0", { lotSize: m.lotSize });
  }
}

export function assertMarketActive(m: Market): void {
  if (m.status !== "ACTIVE") {
    throw new CoreError(CoreErrorCode.MARKET_NOT_ACTIVE, "Market is not active", { marketId: m.id, status: m.status });
  }
}
