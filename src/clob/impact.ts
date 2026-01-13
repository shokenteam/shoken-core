import type { Orderbook } from "./types";
import { simulateMarketByNotional, TradeDirection } from "./simulate";

export interface ImpactEstimate {
  direction: TradeDirection;
  notional: number;

  filledPct: number;        // 0..1
  slippagePct?: number;     // 0..1
  avgPrice?: number;
  worstPrice?: number;

  warning?: "LOW_LIQUIDITY" | "HIGH_SLIPPAGE";
}

/**
 * Simple UX helper:
 * - Run notional simulation
 * - Return a lightweight impact estimate for UI
 */
export function estimateImpact(
  book: Orderbook,
  direction: TradeDirection,
  notional: number,
  opts?: {
    highSlippagePct?: number;  // default 0.01 (1%)
    minFillPct?: number;       // default 0.98 (98%)
  }
): ImpactEstimate {
  const highSlippagePct = opts?.highSlippagePct ?? 0.01;
  const minFillPct = opts?.minFillPct ?? 0.98;

  const r = simulateMarketByNotional(book, direction, notional);

  const filledPct = r.requestedNotional > 0 ? r.spentNotional / r.requestedNotional : 0;

  let warning: ImpactEstimate["warning"];
  if (filledPct < minFillPct) warning = "LOW_LIQUIDITY";
  else if (r.slippagePct != null && r.slippagePct > highSlippagePct) warning = "HIGH_SLIPPAGE";

  return {
    direction,
    notional,
    filledPct,
    slippagePct: r.slippagePct,
    avgPrice: r.avgPrice,
    worstPrice: r.worstPrice,
    warning,
  };
}
