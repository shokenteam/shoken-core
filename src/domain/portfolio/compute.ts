import type { PortfolioState, PortfolioSummary } from "./types";

export function computePortfolioSummary(state: PortfolioState): PortfolioSummary {
  let unrealized = 0;
  let exposure = 0;

  // Perps: compute exposure and unrealized based on markPrice if provided
  for (const pos of Object.values(state.perps)) {
    const mark = pos.markPrice;
    if (mark != null) {
      const pnl = (mark - pos.entryPrice) * pos.size; // long positive size, short negative size
      unrealized += pnl;
      exposure += Math.abs(pos.size) * mark;
    } else {
      // if no mark price, at least estimate exposure at entry
      exposure += Math.abs(pos.size) * pos.entryPrice;
    }
  }

  // Predictions: value from lastPrice if available
  for (const pos of Object.values(state.predictions)) {
    if (pos.lastPrice != null) {
      exposure += pos.shares * pos.lastPrice;
    } else {
      exposure += pos.shares * pos.avgPrice;
    }
  }

  const equity = state.balances.USDC + unrealized;

  return {
    equityUSDC: equity,
    availableUSDC: state.balances.USDC, // beta: no locked margin modeling yet
    unrealizedPnlUSDC: unrealized,
    exposureUSDC: exposure,
    perpCount: Object.keys(state.perps).length,
    predictionCount: Object.keys(state.predictions).length,
  };
}
